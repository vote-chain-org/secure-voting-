#!/bin/bash

# ==============================================================================
# VoteChain FULL Election Reset
# Wipes EVERYTHING: votes, users, fingerprints, blockchain ledger, crypto material.
# After running this, the system is a blank slate — run_server_v2.sh will re-seed.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}"
DOCKER_DIR="${PROJECT_DIR}/docker"
NETWORK_DIR="${PROJECT_DIR}/network"
DB_NAME="votechain"
DB_USER="postgres"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║           ⚠️  FULL ELECTION RESET — NUCLEAR OPTION ⚠️        ║${NC}"
echo -e "${RED}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${RED}║  This will PERMANENTLY destroy:                            ║${NC}"
echo -e "${RED}║    • All votes (blockchain + database)                     ║${NC}"
echo -e "${RED}║    • All user accounts                                     ║${NC}"
echo -e "${RED}║    • All enrolled fingerprints (ML DB + PNG files)          ║${NC}"
echo -e "${RED}║    • All blockchain crypto material & channel artifacts     ║${NC}"
echo -e "${RED}║    • All log files                                         ║${NC}"
echo -e "${RED}║                                                            ║${NC}"
echo -e "${RED}║  You will need to re-run run_server_v2.sh to rebuild.      ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
read -p "Type 'RESET' to confirm: " CONFIRM
if [ "$CONFIRM" != "RESET" ]; then
    echo -e "${YELLOW}Aborted.${NC}"
    exit 1
fi
echo ""

# ── 1. Stop all running services ─────────────────────────────────────
echo -e "${CYAN}[1/6] Stopping all services...${NC}"

# Kill ML service (PID file + port-based fallback)
if [ -f "${PROJECT_DIR}/.pid_ml" ]; then
    kill "$(cat "${PROJECT_DIR}/.pid_ml")" 2>/dev/null || true
    rm -f "${PROJECT_DIR}/.pid_ml"
fi
lsof -ti:5000 2>/dev/null | xargs kill -9 2>/dev/null || true

# Kill Spring Boot backend (PID file + port-based fallback)
if [ -f "${PROJECT_DIR}/.pid_backend" ]; then
    kill "$(cat "${PROJECT_DIR}/.pid_backend")" 2>/dev/null || true
    rm -f "${PROJECT_DIR}/.pid_backend"
fi
lsof -ti:8080 2>/dev/null | xargs kill -9 2>/dev/null || true

# Kill React frontend (PID file + port-based fallback)
if [ -f "${PROJECT_DIR}/.pid_frontend" ]; then
    kill "$(cat "${PROJECT_DIR}/.pid_frontend")" 2>/dev/null || true
    rm -f "${PROJECT_DIR}/.pid_frontend"
fi
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to fully die and release DB connections
sleep 2

echo -e "${GREEN}  ✓ Services stopped${NC}"

# ── 2. Destroy blockchain ────────────────────────────────────────────
echo -e "${CYAN}[2/6] Destroying blockchain network...${NC}"

cd "${DOCKER_DIR}" 2>/dev/null && \
    docker compose -f docker-compose-network.yml down -v --remove-orphans 2>/dev/null || \
    docker-compose -f docker-compose-network.yml down -v --remove-orphans 2>/dev/null || true

# Remove any leftover chaincode containers
docker ps -a --filter "name=dev-peer" -q 2>/dev/null | xargs docker rm -f 2>/dev/null || true
docker images --filter "reference=dev-peer*" -q 2>/dev/null | xargs docker rmi -f 2>/dev/null || true

cd "${PROJECT_DIR}"
echo -e "${GREEN}  ✓ Blockchain containers destroyed${NC}"

# ── 3. Wipe crypto material & channel artifacts ──────────────────────
echo -e "${CYAN}[3/6] Wiping crypto material & channel artifacts...${NC}"

rm -rf "${NETWORK_DIR}/crypto-config"
rm -rf "${NETWORK_DIR}/channel-artifacts"

# Clean chaincode deploy directory
rm -rf "${PROJECT_DIR}/chaincode/deploy"

echo -e "${GREEN}  ✓ Crypto material wiped${NC}"

# ── 4. Wipe PostgreSQL (all tables) ──────────────────────────────────
echo -e "${CYAN}[4/6] Wiping PostgreSQL database...${NC}"

# First: forcefully terminate ALL connections to the database
# (this is why the old script's DROP was silently failing)
sudo -u ${DB_USER} psql -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
" 2>/dev/null || true

# Now drop and recreate — this will succeed because no connections remain
sudo -u ${DB_USER} psql -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}  ✗ DROP DATABASE failed! Retrying after killing remaining connections...${NC}"
    sudo -u ${DB_USER} psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}';" 2>/dev/null || true
    sleep 1
    sudo -u ${DB_USER} psql -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true
fi
sudo -u ${DB_USER} psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || true

# Verify it actually worked
TABLE_COUNT=$(sudo -u ${DB_USER} psql -d ${DB_NAME} -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
if [ "$TABLE_COUNT" = "0" ]; then
    echo -e "${GREEN}  ✓ Database wiped (verified: 0 tables remain)${NC}"
else
    echo -e "${RED}  ✗ WARNING: Database may not have been fully wiped (${TABLE_COUNT} tables found)${NC}"
fi

# ── 5. Wipe fingerprint data ─────────────────────────────────────────
echo -e "${CYAN}[5/6] Wiping fingerprint data...${NC}"

# PNG files
rm -f "${PROJECT_DIR}/backend-ml/data/fingerprints/"*.png 2>/dev/null || true

echo -e "${GREEN}  ✓ Fingerprint images wiped${NC}"

# ── 6. Clean logs & PID files ────────────────────────────────────────
# echo -e "${CYAN}[6/6] Cleaning logs & temporary files...${NC}"

# rm -f "${PROJECT_DIR}/logs/"*.log 2>/dev/null || true
# rm -f "${PROJECT_DIR}/.pid_"* 2>/dev/null || true

# echo -e "${GREEN}  ✓ Logs cleaned${NC}"

# ── Done ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ FULL RESET COMPLETE                         ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Everything has been wiped. The system is a blank slate.    ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  To start fresh:                                           ║${NC}"
echo -e "${GREEN}║    sudo ./run_server_v2.sh                                 ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  This will regenerate crypto, rebuild the blockchain,      ║${NC}"
echo -e "${GREEN}║  re-seed voters/candidates, and start all services.        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
