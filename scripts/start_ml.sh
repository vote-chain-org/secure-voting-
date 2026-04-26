#!/bin/bash
# ── Start ML Fingerprint Service ─────────────────────────────────────
# Prerequisites:
#   - Python 3.9+ installed
# ─────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
ML_DIR="${PROJECT_DIR}/backend-ml"

echo "Starting ML fingerprint service..."
cd "${ML_DIR}"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
source venv/bin/activate
echo "  Installing dependencies..."
pip install -r requirements.txt --quiet

# Ensure fingerprint data directory exists
mkdir -p data/fingerprints

echo ""
echo "  Fingerprint directory: ${ML_DIR}/data/fingerprints/"
echo "  Listening on: http://localhost:5000"
echo ""

# Run the ML service
uvicorn api.main:app --host 0.0.0.0 --port 5000 --reload
