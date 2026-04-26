#!/bin/bash
# ── Start React Frontend ─────────────────────────────────────────────
# Prerequisites:
#   - Node.js 18+ and npm installed
# ─────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
FRONTEND_DIR="${PROJECT_DIR}/frontend"

echo "Starting React frontend..."
cd "${FRONTEND_DIR}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "  Installing npm dependencies..."
    npm install
fi

# Set API URL for local development
export REACT_APP_API_URL="http://localhost:8080"

echo ""
echo "  API URL: ${REACT_APP_API_URL}"
echo "  Frontend: http://localhost:3000"
echo ""

npm start
