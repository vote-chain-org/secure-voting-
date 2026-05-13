#!/bin/bash
# ── Start Spring Boot Backend ────────────────────────────────────────
# Prerequisites:
#   - Java 17+ installed
#   - PostgreSQL running with database 'votechain'
#   - Fabric network running (scripts/start_network.sh)
# ─────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
BACKEND_DIR="${PROJECT_DIR}/backend"

echo "Starting Spring Boot backend..."

# ── Environment variables ─────────────────────────────────────────
export DATABASE_URL="jdbc:postgresql://localhost:5432/votechain"
export DB_USERNAME="postgres"
export DB_PASSWORD="postgres"
export JWT_SECRET="votechainsecretkey1234567890123456"
export JWT_EXPIRATION="86400000"
export ML_SERVICE_URL="http://localhost:5000"
export FABRIC_PEER_ENDPOINT="localhost:7051"

# Fabric crypto paths (relative to where Spring Boot runs from)
export FABRIC_CERT_PATH="${PROJECT_DIR}/network/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts"
export FABRIC_KEY_PATH="${PROJECT_DIR}/network/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore"
export FABRIC_TLS_CERT_PATH="${PROJECT_DIR}/network/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"

cd "${BACKEND_DIR}"

echo ""
echo "  Database:   ${DATABASE_URL}"
echo "  ML Service: ${ML_SERVICE_URL}"
echo "  Fabric:     ${FABRIC_PEER_ENDPOINT}"
echo ""

./mvnw spring-boot:run
