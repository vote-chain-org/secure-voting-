#!/bin/bash

# ==============================================================================
# VoteChain Election Reset Tool
# Wipes all votes from both the Blockchain and the Database.
# Keeps user accounts intact.
# ==============================================================================

PROJECT_DIR=$(pwd)
DOCKER_DIR="${PROJECT_DIR}/docker"
DB_NAME="votechain"

echo "⚠️  WARNING: This will delete ALL votes from the Blockchain AND the Database."
echo "User accounts will be preserved, but their voting history will be cleared."
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# 1. Wipe Blockchain
echo "Clearing Blockchain ledger..."
cd "${DOCKER_DIR}"
docker compose -f docker-compose-network.yml down -v
cd "${PROJECT_DIR}"

# 2. Wipe Database Votes
echo "Clearing Database vote history..."
sudo -u postgres psql -d $DB_NAME -c "TRUNCATE TABLE votes CASCADE;"

# 3. Wipe Fingerprints (Recommended to keep sync with empty blockchain)
read -p "Do you also want to clear all enrolled fingerprints? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f backend-ml/data/fingerprints/*.png
    echo "Fingerprints cleared."
fi

echo "✅ Election reset complete. You can now start the server for a fresh election."
