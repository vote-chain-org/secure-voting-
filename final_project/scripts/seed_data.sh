#!/bin/bash
# ── Seed Test Data ───────────────────────────────────────────────────
# Registers test voters and candidates in:
#   1. Spring Boot backend (PostgreSQL users)
#   2. ML service (fingerprint enrollment)
#   3. Hyperledger Fabric (on-chain voter/candidate registry)
#
# Prerequisites:
#   - Backend running on localhost:8080
#   - ML service running on localhost:5000
#   - Fabric network running (chaincode deployed)
# ─────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
BACKEND_URL="http://localhost:8080"
ML_URL="http://localhost:5000"
FP_DIR="${PROJECT_DIR}/backend-ml/data/fingerprints"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Seeding Test Data                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Create sample fingerprint images for testing ──────────────────
echo "── Creating sample fingerprint images..."
mkdir -p "${FP_DIR}"

# Generate simple test fingerprint images using Python
python3 -c "
import numpy as np
from PIL import Image, ImageDraw
import os

fp_dir = '${FP_DIR}'

voters = ['V001', 'V002', 'V003']
for i, vid in enumerate(voters):
    # Create a unique pattern for each voter
    img = Image.new('L', (300, 300), 240)
    draw = ImageDraw.Draw(img)
    # Draw concentric ellipses with voter-specific spacing
    for r in range(10, 150, 4 + i):
        draw.ellipse([150-r, 150-r, 150+r, 150+r], outline=60 + i*20, width=2)
    # Add some unique lines (ridges)
    for y in range(20 + i*7, 280, 8 + i*2):
        draw.line([(30, y), (270, y + (i+1)*3)], fill=80, width=1)
    img.save(os.path.join(fp_dir, f'{vid}.png'))
    print(f'  Created fingerprint for {vid}')
"

echo "  ✓ Sample fingerprints created"

# ── Register voters in Spring Boot backend (PostgreSQL) ───────────
echo ""
echo "── Registering voters in backend..."

for i in 1 2 3; do
    VID="V00${i}"
    EMAIL="voter${i}@test.com"
    NAME="Test Voter ${i}"
    PHONE="+91900000000${i}"

    echo "   Registering ${NAME} (${VID})..."
    curl -s -X POST "${BACKEND_URL}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"fullName\": \"${NAME}\",
            \"email\": \"${EMAIL}\",
            \"voterId\": \"${VID}\",
            \"phone\": \"${PHONE}\",
            \"password\": \"password123\"
        }" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'     ✓ {d.get(\"fullName\",\"\")} registered ({d.get(\"email\",\"\")})')" 2>/dev/null || echo "     (may already exist)"
done

# ── Register voters on blockchain ─────────────────────────────────
echo ""
echo "── Registering voters on blockchain..."

for i in 1 2 3; do
    VID="V00${i}"
    echo "   Registering ${VID} on chain..."
    docker exec fabric-cli peer chaincode invoke \
        -o orderer.election.example.com:7050 \
        -C electionchannel \
        -n voting \
        -c "{\"function\":\"registerVoter\",\"Args\":[\"${VID}\"]}" \
        --tls \
        --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/election.example.com/orderers/orderer.election.example.com/msp/tlscacerts/tlsca.election.example.com-cert.pem \
        --peerAddresses peer0.org1.example.com:7051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
        2>&1 | grep -q "result: status:200" && echo "     ✓ ${VID} registered on chain" || echo "     ${VID} (may already exist)"
done

# ── Register candidates on blockchain ─────────────────────────────
echo ""
echo "── Registering candidates on blockchain..."

declare -A CANDIDATES
CANDIDATES[1]="Priya Sharma"
CANDIDATES[2]="Arjun Kulkarni"
CANDIDATES[3]="Sneha Patil"
CANDIDATES[4]="Rohan Desai"

for CID in 1 2 3 4; do
    NAME="${CANDIDATES[${CID}]}"
    echo "   Registering candidate ${CID}: ${NAME}..."
    docker exec fabric-cli peer chaincode invoke \
        -o orderer.election.example.com:7050 \
        -C electionchannel \
        -n voting \
        -c "{\"function\":\"registerCandidate\",\"Args\":[\"${CID}\",\"${NAME}\"]}" \
        --tls \
        --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/election.example.com/orderers/orderer.election.example.com/msp/tlscacerts/tlsca.election.example.com-cert.pem \
        --peerAddresses peer0.org1.example.com:7051 \
        --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
        2>&1 | grep -q "result: status:200" && echo "     ✓ Candidate ${CID} registered" || echo "     Candidate ${CID} (may already exist)"
done

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  ✓ Test data seeded!"
echo ""
echo "  Test Voters:"
echo "    V001 — voter1@test.com / password123"
echo "    V002 — voter2@test.com / password123"
echo "    V003 — voter3@test.com / password123"
echo ""
echo "  Fingerprints: ${FP_DIR}/"
echo "  To vote: upload the matching V00X.png file"
echo "══════════════════════════════════════════════════════════"
