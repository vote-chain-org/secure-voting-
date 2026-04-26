#!/bin/bash
./update_network_ip.sh
# ══════════════════════════════════════════════════════════════════════
# VoteChain — Complete Server Setup & Launch Script
# ══════════════════════════════════════════════════════════════════════
#
# This script does EVERYTHING:
#   1. Creates PostgreSQL database (if missing)
#   2. Generates Fabric crypto & channel artifacts
#   3. Starts Fabric Docker containers
#   4. Creates channel & deploys chaincode
#   5. Starts ML service (background)
#   6. Starts Spring Boot backend (background)
#   7. Seeds test data
#   8. Starts React frontend (background)
#
# Usage:
#   chmod +x run_server.sh
#   ./run_server.sh
#
# To stop:
#   ./run_server.sh stop
#
# ══════════════════════════════════════════════════════════════════════

set -e

# ── Configuration (specific to your laptop) ──────────────────────────
PROJECT_DIR="/home/shreyas/Downloads/GIT_CLONES/devansh/secure-voting-/final_project"
FABRIC_BIN="/home/shreyas/workspaces/hyperledger/fabric-samples/bin"
FABRIC_CFG_PATH="${PROJECT_DIR}/network"

NETWORK_DIR="${PROJECT_DIR}/network"
DOCKER_DIR="${PROJECT_DIR}/docker"
CHAINCODE_DIR="${PROJECT_DIR}/chaincode"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_DIR="${PROJECT_DIR}/frontend"
ML_DIR="${PROJECT_DIR}/backend-ml"

CRYPTO_DIR="${NETWORK_DIR}/crypto-config"
CHANNEL_ARTIFACTS="${NETWORK_DIR}/channel-artifacts"

CHANNEL_NAME="electionchannel"
CHAINCODE_NAME="voting"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE=1

DB_NAME="votechain"
DB_USER="postgres"
DB_PASS="postgres"

# Add Fabric binaries to PATH
export PATH="${FABRIC_BIN}:${PATH}"
export FABRIC_CFG_PATH="${FABRIC_CFG_PATH}"

# Detect server IP for LAN access
SERVER_IP=$(hostname -I | awk '{print $1}')

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_banner() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}VoteChain — Secure Blockchain Voting System${NC}                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}Server Launcher${NC}                                           ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  $1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_ok() {
    echo -e "  ${GREEN}✓${NC} $1"
}

print_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
}

print_fail() {
    echo -e "  ${RED}✗${NC} $1"
}

# ── STOP MODE ────────────────────────────────────────────────────────
if [ "${1}" = "stop" ]; then
    echo -e "${RED}Stopping all VoteChain services...${NC}"

    # Kill background services by PID files
    for pidfile in "${PROJECT_DIR}/.pid_ml" "${PROJECT_DIR}/.pid_backend" "${PROJECT_DIR}/.pid_frontend"; do
        if [ -f "$pidfile" ]; then
            PID=$(cat "$pidfile")
            if kill -0 "$PID" 2>/dev/null; then
                kill "$PID" 2>/dev/null || true
                echo "  Stopped PID $PID ($(basename $pidfile))"
            fi
            rm -f "$pidfile"
        fi
    done

    # Stop Fabric network
    cd "${DOCKER_DIR}"
    docker compose -f docker-compose-network.yml stop 2>/dev/null || true

    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
fi

# ══════════════════════════════════════════════════════════════════════
#  START EVERYTHING
# ══════════════════════════════════════════════════════════════════════

print_banner

# ── Pre-flight checks ────────────────────────────────────────────────
print_step "Step 0/8 — Pre-flight Checks"

command -v java >/dev/null 2>&1 && print_ok "Java $(java -version 2>&1 | head -1 | awk -F'"' '{print $2}')" || { print_fail "Java not found"; exit 1; }
command -v mvn >/dev/null 2>&1 && print_ok "Maven $(mvn -version 2>&1 | head -1 | awk '{print $3}')" || { print_fail "Maven not found"; exit 1; }
command -v docker >/dev/null 2>&1 && print_ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')" || { print_fail "Docker not found"; exit 1; }
command -v node >/dev/null 2>&1 && print_ok "Node.js $(node -v)" || { print_fail "Node.js not found"; exit 1; }
command -v python3 >/dev/null 2>&1 && print_ok "Python $(python3 --version | awk '{print $2}')" || { print_fail "Python3 not found"; exit 1; }
command -v cryptogen >/dev/null 2>&1 && print_ok "Fabric binaries found" || { print_fail "Fabric binaries not in PATH. Expected at: ${FABRIC_BIN}"; exit 1; }

# Check Docker daemon is running
docker info >/dev/null 2>&1 && print_ok "Docker daemon running" || { print_fail "Docker daemon not running. Run: sudo systemctl start docker"; exit 1; }

# ── Step 1: PostgreSQL Database ──────────────────────────────────────
print_step "Step 1/8 — PostgreSQL Database"

if sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
    print_ok "Database '${DB_NAME}' already exists"
else
    echo "  Creating database '${DB_NAME}'..."
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null
    sudo -u postgres psql -c "ALTER USER ${DB_USER} PASSWORD '${DB_PASS}';" 2>/dev/null
    print_ok "Database '${DB_NAME}' created"
fi

# ── Step 2: Generate Fabric Crypto Material ──────────────────────────
print_step "Step 2/8 — Fabric Crypto Material"

cd "${NETWORK_DIR}"

if [ -d "${CRYPTO_DIR}/peerOrganizations" ]; then
    print_ok "Crypto material already exists (delete ${CRYPTO_DIR} to regenerate)"
else
    echo "  Generating crypto material with cryptogen..."
    cryptogen generate --config="${NETWORK_DIR}/crypto-config.yaml" --output="${CRYPTO_DIR}"
    print_ok "Crypto material generated"
fi

# ── Step 3: Generate Channel Artifacts ───────────────────────────────
print_step "Step 3/8 — Channel Artifacts"

mkdir -p "${CHANNEL_ARTIFACTS}"

if [ -f "${CHANNEL_ARTIFACTS}/genesis.block" ]; then
    print_ok "Genesis block exists"
else
    echo "  Generating genesis block..."
    configtxgen -profile ElectionOrdererGenesis \
        -channelID system-channel \
        -outputBlock "${CHANNEL_ARTIFACTS}/genesis.block"
    print_ok "Genesis block generated"
fi

if [ -f "${CHANNEL_ARTIFACTS}/${CHANNEL_NAME}.tx" ]; then
    print_ok "Channel transaction exists"
else
    echo "  Generating channel transaction..."
    configtxgen -profile ElectionChannel \
        -outputCreateChannelTx "${CHANNEL_ARTIFACTS}/${CHANNEL_NAME}.tx" \
        -channelID "${CHANNEL_NAME}"
    print_ok "Channel transaction generated"
fi

if [ ! -f "${CHANNEL_ARTIFACTS}/Org1MSPanchors.tx" ]; then
    configtxgen -profile ElectionChannel \
        -outputAnchorPeersUpdate "${CHANNEL_ARTIFACTS}/Org1MSPanchors.tx" \
        -channelID "${CHANNEL_NAME}" \
        -asOrg Org1MSP
    print_ok "Anchor peer update generated"
fi

# ── Step 4: Start Fabric Docker Network ──────────────────────────────
print_step "Step 4/8 — Fabric Docker Network"

cd "${DOCKER_DIR}"

# Check if containers are already running
if docker ps --format '{{.Names}}' | grep -q "peer0.org1.example.com"; then
    print_ok "Fabric containers already running"
else
    echo "  Starting Docker containers..."
    docker compose -f docker-compose-network.yml up -d
    print_ok "Fabric containers started"
    echo "  Waiting 12 seconds for containers to initialize..."
    sleep 12
fi

# ── Step 5: Create Channel & Deploy Chaincode ────────────────────────
print_step "Step 5/8 — Channel & Chaincode"

ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/election.example.com/orderers/orderer.election.example.com/msp/tlscacerts/tlsca.election.example.com-cert.pem"
PEER_TLS="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"

# Check if channel already exists on peer
CHANNEL_EXISTS=$(docker exec fabric-cli peer channel list 2>/dev/null | grep -c "${CHANNEL_NAME}" || true)

if [ "$CHANNEL_EXISTS" -gt 0 ]; then
    print_ok "Channel '${CHANNEL_NAME}' already exists on peer"
else
    echo "  Creating channel '${CHANNEL_NAME}'..."
    docker exec fabric-cli peer channel create \
        -o orderer.election.example.com:7050 \
        -c "${CHANNEL_NAME}" \
        -f "/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.tx" \
        --tls --cafile "${ORDERER_CA}" 2>&1 | tail -1
    print_ok "Channel created"

    echo "  Joining peer to channel..."
    docker exec fabric-cli peer channel join -b "${CHANNEL_NAME}.block" 2>&1 | tail -1
    print_ok "Peer joined channel"
fi

# Build chaincode if not built
if [ ! -f "${CHAINCODE_DIR}/target/voting-chaincode-1.0.0.jar" ]; then
    echo "  Building chaincode with Maven..."
    cd "${CHAINCODE_DIR}"
    mvn clean package -DskipTests -q
    print_ok "Chaincode built"
else
    print_ok "Chaincode JAR exists"
fi

# Check if chaincode already committed
CC_COMMITTED=$(docker exec fabric-cli peer lifecycle chaincode querycommitted -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" 2>/dev/null | grep -c "Version: ${CHAINCODE_VERSION}" || true)

if [ "$CC_COMMITTED" -gt 0 ]; then
    print_ok "Chaincode '${CHAINCODE_NAME}' already committed"
else
    echo "  Preparing pre-built chaincode for instant deployment..."
    rm -rf "${CHAINCODE_DIR}/deploy"
    mkdir -p "${CHAINCODE_DIR}/deploy"
    cp "${CHAINCODE_DIR}/target/voting-chaincode-1.0.0.jar" "${CHAINCODE_DIR}/deploy/"

    echo "  Packaging chaincode..."
    docker exec fabric-cli peer lifecycle chaincode package \
        "${CHAINCODE_NAME}.tar.gz" \
        --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/deploy \
        --lang java \
        --label "${CHAINCODE_NAME}_${CHAINCODE_VERSION}" 2>&1 | tail -1

    echo "  Installing chaincode on peer..."
    docker exec fabric-cli peer lifecycle chaincode install "${CHAINCODE_NAME}.tar.gz" 2>&1 | tail -2

    PACKAGE_ID=$(docker exec fabric-cli peer lifecycle chaincode queryinstalled 2>&1 | grep "${CHAINCODE_NAME}_${CHAINCODE_VERSION}" | sed -n 's/.*Package ID: \(.*\), Label.*/\1/p')
    echo "  Package ID: ${PACKAGE_ID}"

    echo "  Approving chaincode for Org1..."
    docker exec fabric-cli peer lifecycle chaincode approveformyorg \
        -o orderer.election.example.com:7050 \
        --channelID "${CHANNEL_NAME}" \
        --name "${CHAINCODE_NAME}" \
        --version "${CHAINCODE_VERSION}" \
        --package-id "${PACKAGE_ID}" \
        --sequence ${CHAINCODE_SEQUENCE} \
        --tls --cafile "${ORDERER_CA}" 2>&1 | tail -1

    echo "  Committing chaincode..."
    docker exec fabric-cli peer lifecycle chaincode commit \
        -o orderer.election.example.com:7050 \
        --channelID "${CHANNEL_NAME}" \
        --name "${CHAINCODE_NAME}" \
        --version "${CHAINCODE_VERSION}" \
        --sequence ${CHAINCODE_SEQUENCE} \
        --tls --cafile "${ORDERER_CA}" \
        --peerAddresses peer0.org1.example.com:7051 \
        --tlsRootCertFiles "${PEER_TLS}" 2>&1 | tail -1

    print_ok "Chaincode deployed and committed"

    echo "  Waiting 10 seconds for chaincode container to start..."
    sleep 10
fi

# ── Step 6: Start ML Service ─────────────────────────────────────────
print_step "Step 6/8 — ML Fingerprint Service (port 5000)"

cd "${ML_DIR}"

if [ ! -f "/usr/local/lib/libsgfplib.so" ]; then
    print_fail "SecuGen Linux SDK not found in /usr/local/lib!"
    echo -e "  Please run: ${YELLOW}sudo ./setup_sdk.sh${NC} first to install the SDK."
    exit 1
fi

# Kill existing ML service if running
if [ -f "${PROJECT_DIR}/.pid_ml" ]; then
    OLD_PID=$(cat "${PROJECT_DIR}/.pid_ml")
    kill "$OLD_PID" 2>/dev/null || true
fi

# Create virtualenv if needed
if [ ! -d "venv" ]; then
    echo "  Creating Python virtualenv..."
    python3 -m venv venv
fi

# Activate virtualenv (must be set up manually first)
source venv/bin/activate

mkdir -p data/fingerprints

echo "  Starting ML service in background..."
nohup uvicorn api.main:app --host 0.0.0.0 --port 5000 > "${PROJECT_DIR}/logs/ml.log" 2>&1 &
ML_PID=$!
echo $ML_PID > "${PROJECT_DIR}/.pid_ml"
deactivate

sleep 3

if kill -0 "$ML_PID" 2>/dev/null; then
    print_ok "ML service running (PID: ${ML_PID})"
else
    print_fail "ML service failed to start. Check logs/ml.log"
    exit 1
fi

# ── Step 7: Start Spring Boot Backend ────────────────────────────────
print_step "Step 7/8 — Spring Boot Backend (port 8080)"

cd "${BACKEND_DIR}"

# Kill existing backend if running
if [ -f "${PROJECT_DIR}/.pid_backend" ]; then
    OLD_PID=$(cat "${PROJECT_DIR}/.pid_backend")
    kill "$OLD_PID" 2>/dev/null || true
    sleep 2
fi

# Set environment variables
export DATABASE_URL="jdbc:postgresql://localhost:5432/${DB_NAME}"
export DB_USERNAME="${DB_USER}"
export DB_PASSWORD="${DB_PASS}"
export JWT_SECRET="votechainsecretkey1234567890123456"
export JWT_EXPIRATION="86400000"
export ML_SERVICE_URL="http://localhost:5000"
export FABRIC_PEER_ENDPOINT="localhost:7051"
export FABRIC_CERT_PATH="${CRYPTO_DIR}/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts"
export FABRIC_KEY_PATH="${CRYPTO_DIR}/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore"
export FABRIC_TLS_CERT_PATH="${CRYPTO_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"

echo "  Starting Spring Boot backend in background..."
nohup ./mvnw spring-boot:run -q > "${PROJECT_DIR}/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "${PROJECT_DIR}/.pid_backend"

echo "  Waiting for backend to start (this takes 15-30 seconds)..."
for i in $(seq 1 30); do
    if curl -s http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
        break
    fi
    sleep 2
done

if curl -s http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
    print_ok "Backend running (PID: ${BACKEND_PID})"
else
    print_warn "Backend may still be starting. Check logs/backend.log"
fi

# ── Seed Test Data ───────────────────────────────────────────────────
print_step "Step 7.5 — Seeding Test Data"

# Create sample fingerprint images
python3 -c "
import os
try:
    from PIL import Image, ImageDraw
    fp_dir = '${ML_DIR}/data/fingerprints'
    os.makedirs(fp_dir, exist_ok=True)
    voters = ['V001', 'V002', 'V003']
    for i, vid in enumerate(voters):
        if os.path.exists(os.path.join(fp_dir, f'{vid}.png')):
            print(f'  Fingerprint {vid}.png already exists')
            continue
        img = Image.new('L', (300, 300), 240)
        draw = ImageDraw.Draw(img)
        for r in range(10, 150, 4 + i):
            draw.ellipse([150-r, 150-r, 150+r, 150+r], outline=60 + i*20, width=2)
        for y in range(20 + i*7, 280, 8 + i*2):
            draw.line([(30, y), (270, y + (i+1)*3)], fill=80, width=1)
        img.save(os.path.join(fp_dir, f'{vid}.png'))
        print(f'  Created fingerprint {vid}.png')
except ImportError:
    print('  Pillow not installed in system Python, trying venv...')
    os.system('${ML_DIR}/venv/bin/python3 -c \"' + open('/dev/stdin').read() + '\"')
" 2>/dev/null || echo "  Will create fingerprints via venv..."

# Use ML venv python if system python lacks Pillow
if [ ! -f "${ML_DIR}/data/fingerprints/V001.png" ]; then
    ${ML_DIR}/venv/bin/python3 -c "
import os
from PIL import Image, ImageDraw
fp_dir = '${ML_DIR}/data/fingerprints'
os.makedirs(fp_dir, exist_ok=True)
voters = ['V001', 'V002', 'V003']
for i, vid in enumerate(voters):
    img = Image.new('L', (300, 300), 240)
    draw = ImageDraw.Draw(img)
    for r in range(10, 150, 4 + i):
        draw.ellipse([150-r, 150-r, 150+r, 150+r], outline=60 + i*20, width=2)
    for y in range(20 + i*7, 280, 8 + i*2):
        draw.line([(30, y), (270, y + (i+1)*3)], fill=80, width=1)
    img.save(os.path.join(fp_dir, f'{vid}.png'))
    print(f'  Created fingerprint {vid}.png')
"
fi

# Register voters in backend
for i in 1 2 3; do
    VID="V00${i}"
    EMAIL="voter${i}@test.com"
    NAME="Test Voter ${i}"
    PHONE="+91900000000${i}"

    RESULT=$(curl -s -X POST "http://localhost:8080/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"fullName\": \"${NAME}\",
            \"email\": \"${EMAIL}\",
            \"voterId\": \"${VID}\",
            \"phone\": \"${PHONE}\",
            \"password\": \"password123\"
        }" 2>/dev/null)
    
    if echo "$RESULT" | grep -q "token"; then
        print_ok "Registered ${NAME} (${EMAIL})"
    else
        print_warn "${NAME} — may already exist"
    fi
done

# Register voters and candidates on blockchain
set +e
for i in 1 2 3; do
    VID="V00${i}"
    docker exec fabric-cli peer chaincode invoke \
        -o orderer.election.example.com:7050 \
        -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" \
        -c "{\"function\":\"registerVoter\",\"Args\":[\"${VID}\"]}" \
        --tls --cafile "${ORDERER_CA}" \
        --peerAddresses peer0.org1.example.com:7051 \
        --tlsRootCertFiles "${PEER_TLS}" 2>&1 | grep -q "status:200" && \
        print_ok "Voter ${VID} registered on blockchain" || \
        print_warn "Voter ${VID} — may already exist on chain"
done

declare -A CANDIDATES=([1]="Priya Sharma" [2]="Arjun Kulkarni" [3]="Sneha Patil" [4]="Rohan Desai")
for CID in 1 2 3 4; do
    NAME="${CANDIDATES[${CID}]}"
    docker exec fabric-cli peer chaincode invoke \
        -o orderer.election.example.com:7050 \
        -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" \
        -c "{\"function\":\"registerCandidate\",\"Args\":[\"${CID}\",\"${NAME}\"]}" \
        --tls --cafile "${ORDERER_CA}" \
        --peerAddresses peer0.org1.example.com:7051 \
        --tlsRootCertFiles "${PEER_TLS}" 2>&1 | grep -q "status:200" && \
        print_ok "Candidate ${CID}: ${NAME} registered" || \
        print_warn "Candidate ${CID} — may already exist"
done
set -e

# ── Step 8: Start React Frontend ─────────────────────────────────────
print_step "Step 8/8 — React Frontend (port 3000)"

cd "${FRONTEND_DIR}"

# Kill existing frontend if running
if [ -f "${PROJECT_DIR}/.pid_frontend" ]; then
    OLD_PID=$(cat "${PROJECT_DIR}/.pid_frontend")
    kill "$OLD_PID" 2>/dev/null || true
fi

# Install deps if needed
if [ ! -d "node_modules" ]; then
    echo "  Installing npm dependencies (first time only)..."
    npm install --silent 2>/dev/null
fi

export REACT_APP_API_URL="http://${SERVER_IP}:8080"
export REACT_APP_ML_URL="http://${SERVER_IP}:5000"
export HOST=0.0.0.0
export BROWSER=none

echo "  Starting React frontend in background..."
nohup npm start > "${PROJECT_DIR}/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "${PROJECT_DIR}/.pid_frontend"

sleep 5
print_ok "Frontend starting (PID: ${FRONTEND_PID})"

# ══════════════════════════════════════════════════════════════════════
#  DONE!
# ══════════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}VoteChain is running!${NC}                                      ${GREEN}║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}On this laptop:${NC}                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    Frontend:   ${CYAN}http://localhost:3000${NC}                          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    Backend:    ${CYAN}http://localhost:8080${NC}                          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    ML Service: ${CYAN}http://localhost:5000${NC}                          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}From other laptops (same WiFi):${NC}                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    Open:  ${CYAN}http://${SERVER_IP}:3000${NC}                       ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}Test Accounts:${NC}                                               ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    voter1@test.com / password123  (fingerprint: V001.png)    ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    voter2@test.com / password123  (fingerprint: V002.png)    ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    voter3@test.com / password123  (fingerprint: V003.png)    ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}Fingerprint files:${NC}                                           ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    ${ML_DIR}/data/fingerprints/  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}Logs:${NC} ${PROJECT_DIR}/logs/      ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}To stop:${NC}  ./run_server.sh stop                               ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
