"""
POST /verify — Verify a voter's identity via liveness + minutiae matching.
Standalone route module (can be used with APIRouter if preferred).
"""

from fastapi import APIRouter, File, UploadFile, Form
import os
from api.main import db, model, device, save_upload
from src.pipeline import verify_voter_for_voting

router = APIRouter()

@router.post("/verify")
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
