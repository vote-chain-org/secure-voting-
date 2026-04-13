"""
POST /vote — Record a confirmed vote with blockchain transaction hash.
Standalone route module (can be used with APIRouter if preferred).
"""

from fastapi import APIRouter, Form, HTTPException
from api.main import db

router = APIRouter()

@router.post("/vote")
async def record_vote(voter_id: str = Form(...), blockchain_tx: str = Form(...)):
    try:
        db.record_vote(voter_id, blockchain_tx)
    except RuntimeError as e:
        raise HTTPException(400, str(e))
    return {"status": "vote_recorded", "voter_id": voter_id, "tx": blockchain_tx}
