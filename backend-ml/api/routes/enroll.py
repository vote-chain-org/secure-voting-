"""
POST /enroll — Enroll a voter's fingerprint template.
Standalone route module (can be used with APIRouter if preferred).
"""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
import os
from api.main import db, save_upload

router = APIRouter()

@router.post("/enroll")
async def enroll(voter_id: str = Form(...), fingerprint: UploadFile = File(...)):
    tmp_path = save_upload(fingerprint)
    try:
        success = db.enroll(voter_id, tmp_path)
    finally:
        os.unlink(tmp_path)
    if not success:
        raise HTTPException(400, "Enrollment failed — image quality too low")
    return {"status": "enrolled", "voter_id": voter_id}
