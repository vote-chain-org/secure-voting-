"""
Full verification pipeline for voting:
  Step 1 → Liveness check    (LivenessNet CNN)
  Step 2 → Identity match    (OpenCV minutiae matcher)
  Step 3 → SDK template score (SecuGen GetMatchingScore)

After all steps pass → caller commits vote to Hyperledger Fabric.
Biometric data never leaves the backend. Hyperledger receives vote token only.

Possible result reasons:
  match | no_match | already_voted | not_enrolled | low_quality | integrity_error | liveness_failed
"""

import hashlib
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import torch
from PIL import Image

from src.matcher import extract_minutiae, match_minutiae, serialize_minutiae, deserialize_minutiae
from src.dataset import get_val_transforms

logger = logging.getLogger(__name__)

try:
    import psycopg2
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False

# Try to import SDK matcher — may fail if SDK not installed
try:
    from src.sdk_matcher import create_template_from_png, get_match_score
    SDK_AVAILABLE = True
except Exception as e:
    logger.warning(f"SDK matcher not available: {e}")
    SDK_AVAILABLE = False

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS voter_fingerprints (
    voter_id        VARCHAR(64)  PRIMARY KEY,
    minutiae_data   BYTEA        NOT NULL,
    template_hash   VARCHAR(64)  NOT NULL,
    sg400_template  BYTEA,
    enrolled_at     TIMESTAMP    DEFAULT NOW(),
    has_voted       BOOLEAN      DEFAULT FALSE,
    vote_token      VARCHAR(128)
);
CREATE INDEX IF NOT EXISTS idx_voter ON voter_fingerprints(voter_id);
"""


def _hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def check_liveness(image_path: str, model, device, threshold=0.6) -> tuple:
    transform = get_val_transforms()
    tensor = transform(Image.open(image_path).convert("RGB")).unsqueeze(0).to(device)
    model.eval()
    score = model.liveness_score(tensor).item()
    return score >= threshold, score


class VoterDB:
    def __init__(self, dsn: str):
        if not DB_AVAILABLE:
            raise RuntimeError("pip install psycopg2-binary")
        self.conn = psycopg2.connect(dsn)
        with self.conn.cursor() as cur:
            cur.execute(SCHEMA_SQL)
        self.conn.commit()

    def enroll(self, voter_id: str, image_path: str) -> bool:
        """
        Enroll a voter's fingerprint: extract minutiae + create SDK template.
        Returns False if image quality is too low or voter is already enrolled.
        """
        minutiae = extract_minutiae(image_path)
        if len(minutiae) < 10:
            logger.warning(f"Too few minutiae for {voter_id} — low image quality")
            return False

        data = serialize_minutiae(minutiae)

        # Create SDK template if SDK is available
        sg400 = None
        if SDK_AVAILABLE:
            try:
                sg400 = create_template_from_png(image_path)
                logger.info(f"SDK template created for {voter_id} ({len(sg400)} bytes)")
            except Exception as e:
                logger.warning(f"SDK template creation failed for {voter_id}: {e}")

        with self.conn.cursor() as cur:
            # ON CONFLICT DO NOTHING — re-enrollment is rejected
            cur.execute("""
                INSERT INTO voter_fingerprints (voter_id, minutiae_data, template_hash, sg400_template)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (voter_id) DO NOTHING
            """, (voter_id, psycopg2.Binary(data), _hash(data),
                  psycopg2.Binary(sg400) if sg400 else None))
            inserted = cur.rowcount > 0
        self.conn.commit()

        if not inserted:
            logger.warning(f"Voter {voter_id} already enrolled — re-enrollment rejected")
            return False

        return True

    def verify(self, voter_id: str, probe_path: str, threshold=0.4) -> dict:
        """
        Verify a probe fingerprint against a stored enrollment.
        Returns minutiae match result + SDK score.
        """
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT minutiae_data, template_hash, has_voted, sg400_template "
                "FROM voter_fingerprints WHERE voter_id=%s",
                (voter_id,))
            row = cur.fetchone()

        if not row:
            return {"verified": False, "score": 0.0, "sdk_score": None, "reason": "not_enrolled"}

        stored_bytes, stored_hash, has_voted, sg400_stored = (
            bytes(row[0]), row[1], row[2], bytes(row[3]) if row[3] else None
        )

        if has_voted:
            return {"verified": False, "score": 0.0, "sdk_score": None, "reason": "already_voted"}

        if _hash(stored_bytes) != stored_hash:
            return {"verified": False, "score": 0.0, "sdk_score": None, "reason": "integrity_error"}

        probe_minutiae = extract_minutiae(probe_path)
        if len(probe_minutiae) < 10:
            return {"verified": False, "score": 0.0, "sdk_score": None, "reason": "low_quality"}

        score = match_minutiae(probe_minutiae, deserialize_minutiae(stored_bytes))
        is_match = score >= threshold

        # SDK score — compute if SDK is available and stored template exists
        sdk_score = None
        if is_match and SDK_AVAILABLE and sg400_stored is not None:
            try:
                probe_template = create_template_from_png(probe_path)
                sdk_score = get_match_score(probe_template, sg400_stored)
                logger.info(f"SDK match score for {voter_id}: {sdk_score}/199")
            except Exception as e:
                logger.warning(f"SDK match failed for {voter_id}: {e}")

        return {
            "verified": is_match,
            "score": round(float(score), 4),
            "sdk_score": sdk_score,
            "reason": "match" if is_match else "no_match",
        }

    def record_vote(self, voter_id: str, blockchain_tx: str):
        with self.conn.cursor() as cur:
            cur.execute("""
                UPDATE voter_fingerprints
                SET has_voted=TRUE, vote_token=%s
                WHERE voter_id=%s AND has_voted=FALSE
                RETURNING voter_id
            """, (blockchain_tx, voter_id))
            if not cur.fetchone():
                raise RuntimeError(f"Vote record failed for {voter_id}")
        self.conn.commit()

    def close(self):
        self.conn.close()


def verify_voter_for_voting(voter_id, fingerprint_path, db,
                             liveness_model=None, device=None,
                             liveness_threshold=0.6, match_threshold=0.4) -> dict:
    """
    Full 3-step verification pipeline.
    Returns dict with verified, liveness_score, match_score, sdk_score, reason.
    """
    result = {
        "voter_id": voter_id,
        "verified": False,
        "liveness_score": None,
        "match_score": None,
        "sdk_score": None,
        "reason": None,
    }

    # Step 1: Liveness check
    if liveness_model is not None and device is not None:
        is_live, score = check_liveness(fingerprint_path, liveness_model, device, liveness_threshold)
        result["liveness_score"] = round(score, 4)
        if not is_live:
            result["reason"] = "liveness_failed"
            return result

    # Step 2 + 3: Minutiae match + SDK score
    match_result = db.verify(voter_id, fingerprint_path, match_threshold)
    result.update({
        "match_score": match_result["score"],
        "sdk_score": match_result["sdk_score"],
        "reason": match_result["reason"],
        "verified": match_result["verified"],
    })

    return result
