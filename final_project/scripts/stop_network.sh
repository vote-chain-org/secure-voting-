#!/bin/bash
# ── Stop Hyperledger Fabric Network ──────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
DOCKER_DIR="${PROJECT_DIR}/docker"

echo "Stopping Fabric network..."
cd "${DOCKER_DIR}"
docker-compose -f docker-compose-network.yml down --volumes --remove-orphans 2>/dev/null || true

echo "Cleaning up generated artifacts..."
rm -rf "${PROJECT_DIR}/network/crypto-config"
rm -rf "${PROJECT_DIR}/network/channel-artifacts"

echo "✓ Fabric network stopped and cleaned up"
