"""
FastAPI backend — exposes 3 endpoints:
  POST /enroll       → enroll a voter fingerprint
  POST /verify       → verify identity (liveness + minutiae match + double-vote check)
  POST /vote         → record confirmed vote to Hyperledger

Load the trained liveness model at startup from models/best_model.pt
Connect to PostgreSQL using DATABASE_URL environment variable.
"""

import os, torch
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile, shutil
from src.model import get_model
from src.pipeline import VoterDB, verify_voter_for_voting

app = FastAPI(title="Fingerprint Voting API")

app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

# ── Startup: load model and DB ────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = get_model(pretrained=False)

MODEL_PATH = "models/best_model.pt"
if os.path.exists(MODEL_PATH):
    ckpt = torch.load(MODEL_PATH, map_location=device)
    model.load_state_dict(ckpt["model_state_dict"])
    print(f"Loaded liveness model from {MODEL_PATH}")
else:
    print(f"WARNING: {MODEL_PATH} not found — liveness check disabled until model is trained")
    model = None

if model is not None:
    model.eval().to(device)

DB_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/voting_db")
db = VoterDB(DB_URL)

# ── Helper: save uploaded file to temp path ───────────────────────────────────
def save_upload(file: UploadFile) -> str:
    suffix = "." + file.filename.split(".")[-1] if file.filename else ".png"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    shutil.copyfileobj(file.file, tmp)
    tmp.close()
    return tmp.name

# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/enroll")
async def enroll(voter_id: str = Form(...), fingerprint: UploadFile = File(...)):
    tmp_path = save_upload(fingerprint)
    try:
        success = db.enroll(voter_id, tmp_path)
    finally:
        os.unlink(tmp_path)
    if not success:
        raise HTTPException(400, "Enrollment failed — image quality too low")
    return {"status": "enrolled", "voter_id": voter_id}

@app.post("/verify")
async def verify(voter_id: str = Form(...), fingerprint: UploadFile = File(...)):
    tmp_path = save_upload(fingerprint)
    try:
        result = verify_voter_for_voting(
            voter_id=voter_id,
            fingerprint_path=tmp_path,
            db=db,
            liveness_model=model,
            device=device,
        )
    finally:
        os.unlink(tmp_path)
    return result

@app.post("/vote")
async def record_vote(voter_id: str = Form(...), blockchain_tx: str = Form(...)):
    try:
        db.record_vote(voter_id, blockchain_tx)
    except RuntimeError as e:
        raise HTTPException(400, str(e))
    return {"status": "vote_recorded", "voter_id": voter_id, "tx": blockchain_tx}

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}
