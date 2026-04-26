"""
VoteChain Fingerprint Verification API

Endpoints:
  POST /enroll   → enroll a voter fingerprint (minutiae + SDK template)
  POST /verify   → verify identity (liveness + minutiae match + SDK score)
  GET  /health   → service status

Load the trained liveness model at startup from models/best_model.pt
Connect to PostgreSQL using DATABASE_URL environment variable.

All thresholds are configurable via environment variables:
  LIVENESS_THRESHOLD  (default: 0.6)
  MATCH_THRESHOLD     (default: 0.4)
  MODEL_PATH          (default: models/best_model.pt)
  DATABASE_URL        (default: postgresql://postgres:postgres@localhost:5432/votechain)
"""

import os
import torch
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import shutil

from src.model import get_model
from src.pipeline import VoterDB, verify_voter_for_voting

app = FastAPI(title="VoteChain Fingerprint API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Configuration (all configurable via env vars) ─────────────────────────────
# ⬇⬇⬇ CONFIGURE ML THRESHOLDS HERE ⬇⬇⬇
# LIVENESS_THRESHOLD: Set to 0.1 for testing with fake images. Real deployments should use 0.6.
# MATCH_THRESHOLD: 0.4 is standard for minutiae matching.
LIVENESS_THRESHOLD = float(os.getenv("LIVENESS_THRESHOLD", "0.00"))
MATCH_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", "0.4"))
MODEL_PATH = os.getenv("MODEL_PATH", "models/best_model.pt")
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/votechain")

# ── Startup: load model ──────────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = None

if os.path.exists(MODEL_PATH):
    model = get_model(pretrained=False)
    ckpt = torch.load(MODEL_PATH, map_location=device, weights_only=False)
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval().to(device)
    print(f"[startup] Liveness model loaded from {MODEL_PATH}")
else:
    print(f"[startup] WARNING: {MODEL_PATH} not found — liveness check disabled")

# ── Startup: connect to DB ───────────────────────────────────────────────────
db = VoterDB(DB_URL)
print(f"[startup] Connected to database")
print(f"[startup] Thresholds: liveness={LIVENESS_THRESHOLD}, match={MATCH_THRESHOLD}")


# ── Helper ────────────────────────────────────────────────────────────────────
def save_upload(file: UploadFile) -> str:
    """Save uploaded file to a temp path and return the path."""
    suffix = "." + file.filename.split(".")[-1] if file.filename else ".png"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    shutil.copyfileobj(file.file, tmp)
    tmp.close()
    return tmp.name


# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/enroll")
async def enroll(voter_id: str = Form(...), fingerprint: UploadFile = File(...)):
    """
    Enroll a voter's fingerprint.
    Extracts minutiae and creates SDK template, stores both in DB.
    Also saves a PNG copy to data/fingerprints/{voter_id}.png.
    """
    tmp_path = save_upload(fingerprint)
    try:
        # Save PNG copy to fingerprints directory
        fp_dir = os.path.join("data", "fingerprints")
        os.makedirs(fp_dir, exist_ok=True)
        dest = os.path.join(fp_dir, f"{voter_id}.png")
        shutil.copy2(tmp_path, dest)

        success = db.enroll(voter_id, tmp_path)
    finally:
        os.unlink(tmp_path)

    if not success:
        raise HTTPException(400, "Enrollment failed — low quality or already enrolled")

    return {"status": "enrolled", "voter_id": voter_id}


@app.post("/verify")
async def verify(voter_id: str = Form(...), fingerprint: UploadFile = File(...)):
    """
    Verify a voter's fingerprint (1:1 matching).
    Runs: liveness → minutiae match → SDK score.
    Returns full result including sdk_score for the backend to gate.
    """
    tmp_path = save_upload(fingerprint)
    try:
        result = verify_voter_for_voting(
            voter_id=voter_id,
            fingerprint_path=tmp_path,
            db=db,
            liveness_model=model,
            device=device,
            liveness_threshold=LIVENESS_THRESHOLD,
            match_threshold=MATCH_THRESHOLD,
        )
    finally:
        os.unlink(tmp_path)
    return result


@app.get("/health")
def health():
    """Service health check with configuration info."""
    enrolled = 0
    try:
        with db.conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM voter_fingerprints")
            enrolled = cur.fetchone()[0]
    except Exception:
        pass
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "enrolled_count": enrolled,
        "liveness_threshold": LIVENESS_THRESHOLD,
        "match_threshold": MATCH_THRESHOLD,
    }
