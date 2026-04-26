#!/bin/bash
./update_network_ip.sh
# ══════════════════════════════════════════════════════════════════════
# VoteChain — Robust tmux Session Launcher
# 
# Layout (single window, 4 panes):
#   ┌─────────────────────┬─────────────────────┐
#   │  Pane 0             │  Pane 2             │
#   │  Setup/Seeding/Logs │  ML Service :5000   │
#   ├─────────────────────┼─────────────────────┤
#   │  Pane 1             │  Pane 3             │
#   │  Spring Boot :8080  │  React Frontend     │
#   └─────────────────────┴─────────────────────┘
# ══════════════════════════════════════════════════════════════════════

set -e

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

export PATH="${FABRIC_BIN}:${PATH}"
export FABRIC_CFG_PATH="${FABRIC_CFG_PATH}"
SERVER_IP=$(hostname -I | awk '{print $1}')
SESSION="votechain"

# ── STOP ─────────────────────────────────────────────────────────────
if [ "${1}" = "stop" ]; then
    echo "Stopping VoteChain tmux session..."
    tmux kill-session -t "$SESSION" 2>/dev/null || true
    echo "Stopping Fabric Docker network..."
    cd "${DOCKER_DIR}"
    docker-compose -f docker-compose-network.yml stop 2>/dev/null || true
    echo "Done."
    exit 0
fi

# ── ATTACH ───────────────────────────────────────────────────────────
if [ "${1}" = "attach" ]; then
    tmux attach-session -t "$SESSION"
    exit 0
fi

command -v tmux >/dev/null 2>&1 || { echo "tmux not found. Install with: sudo apt install tmux"; exit 1; }
tmux kill-session -t "$SESSION" 2>/dev/null || true

# ══════════════════════════════════════════════════════════════════════
#  SETUP INFRASTRUCTURE
# ══════════════════════════════════════════════════════════════════════

echo "Step 1: PostgreSQL Database"
if ! sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null
    sudo -u postgres psql -c "ALTER USER ${DB_USER} PASSWORD '${DB_PASS}';" 2>/dev/null
fi

echo "Step 2: Fabric Crypto Material"
cd "${NETWORK_DIR}"
if [ ! -d "${CRYPTO_DIR}/peerOrganizations" ]; then
    cryptogen generate --config="${NETWORK_DIR}/crypto-config.yaml" --output="${CRYPTO_DIR}"
fi

echo "Step 3: Channel Artifacts"
mkdir -p "${CHANNEL_ARTIFACTS}"
if [ ! -f "${CHANNEL_ARTIFACTS}/genesis.block" ]; then
    configtxgen -profile ElectionOrdererGenesis -channelID system-channel -outputBlock "${CHANNEL_ARTIFACTS}/genesis.block"
fi
if [ ! -f "${CHANNEL_ARTIFACTS}/${CHANNEL_NAME}.tx" ]; then
    configtxgen -profile ElectionChannel -outputCreateChannelTx "${CHANNEL_ARTIFACTS}/${CHANNEL_NAME}.tx" -channelID "${CHANNEL_NAME}"
fi
if [ ! -f "${CHANNEL_ARTIFACTS}/Org1MSPanchors.tx" ]; then
    configtxgen -profile ElectionChannel -outputAnchorPeersUpdate "${CHANNEL_ARTIFACTS}/Org1MSPanchors.tx" -channelID "${CHANNEL_NAME}" -asOrg Org1MSP
fi

echo "Step 4: Fabric Docker Network"
cd "${DOCKER_DIR}"
if ! docker ps --format '{{.Names}}' | grep -q "peer0.org1.example.com"; then
    docker-compose -f docker-compose-network.yml up -d
    sleep 12
fi

echo "Step 5: Channel & Chaincode"
ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/election.example.com/orderers/orderer.election.example.com/msp/tlscacerts/tlsca.election.example.com-cert.pem"
PEER_TLS="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"

CHANNEL_EXISTS=$(docker exec fabric-cli peer channel list 2>/dev/null | grep -c "${CHANNEL_NAME}" || true)
if [ "$CHANNEL_EXISTS" -eq 0 ]; then
    docker exec fabric-cli peer channel create -o orderer.election.example.com:7050 -c "${CHANNEL_NAME}" -f "/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.tx" --tls --cafile "${ORDERER_CA}" >/dev/null 2>&1
    docker exec fabric-cli peer channel join -b "${CHANNEL_NAME}.block" >/dev/null 2>&1
fi

if [ ! -f "${CHAINCODE_DIR}/target/voting-chaincode-1.0.0.jar" ]; then
    cd "${CHAINCODE_DIR}" && mvn clean package -DskipTests -q
fi

CC_COMMITTED=$(docker exec fabric-cli peer lifecycle chaincode querycommitted -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" 2>/dev/null | grep -c "Version: ${CHAINCODE_VERSION}" || true)
if [ "$CC_COMMITTED" -eq 0 ]; then
    rm -rf "${CHAINCODE_DIR}/deploy"
    mkdir -p "${CHAINCODE_DIR}/deploy"
    cp "${CHAINCODE_DIR}/target/voting-chaincode-1.0.0.jar" "${CHAINCODE_DIR}/deploy/"
    
    docker exec fabric-cli peer lifecycle chaincode package "${CHAINCODE_NAME}.tar.gz" --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/deploy --lang java --label "${CHAINCODE_NAME}_${CHAINCODE_VERSION}" >/dev/null 2>&1
    docker exec fabric-cli peer lifecycle chaincode install "${CHAINCODE_NAME}.tar.gz" >/dev/null 2>&1
    PACKAGE_ID=$(docker exec fabric-cli peer lifecycle chaincode queryinstalled 2>&1 | grep "${CHAINCODE_NAME}_${CHAINCODE_VERSION}" | sed -n 's/.*Package ID: \(.*\), Label.*/\1/p')
    docker exec fabric-cli peer lifecycle chaincode approveformyorg -o orderer.election.example.com:7050 --channelID "${CHANNEL_NAME}" --name "${CHAINCODE_NAME}" --version "${CHAINCODE_VERSION}" --package-id "${PACKAGE_ID}" --sequence ${CHAINCODE_SEQUENCE} --tls --cafile "${ORDERER_CA}" >/dev/null 2>&1
    docker exec fabric-cli peer lifecycle chaincode commit -o orderer.election.example.com:7050 --channelID "${CHANNEL_NAME}" --name "${CHAINCODE_NAME}" --version "${CHAINCODE_VERSION}" --sequence ${CHAINCODE_SEQUENCE} --tls --cafile "${ORDERER_CA}" --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles "${PEER_TLS}" >/dev/null 2>&1
    sleep 10
fi

# ══════════════════════════════════════════════════════════════════════
#  CREATE SEEDING SCRIPT
# ══════════════════════════════════════════════════════════════════════
cat << 'EOF' > /tmp/seed_votechain.sh
#!/bin/bash
PROJECT_DIR="/home/shreyas/Downloads/GIT_CLONES/devansh/secure-voting-/final_project"
ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/election.example.com/orderers/orderer.election.example.com/msp/tlscacerts/tlsca.election.example.com-cert.pem"
PEER_TLS="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
CHANNEL_NAME="electionchannel"
CHAINCODE_NAME="voting"

echo -e "\033[1;33mWaiting for Spring Boot to start on port 8080 before seeding...\033[0m"
for i in $(seq 1 30); do
    if curl -s http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
        echo -e "\033[0;32mBackend is UP! Starting Data Seeding...\033[0m"
        break
    fi
    sleep 2
done

cd ${PROJECT_DIR}/backend-ml
if [ -d "venv" ]; then source venv/bin/activate; fi
python3 -c "
import os
try:
    from PIL import Image, ImageDraw
    fp_dir = 'data/fingerprints'
    os.makedirs(fp_dir, exist_ok=True)
    voters = ['V001', 'V002', 'V003']
    for i, vid in enumerate(voters):
        if os.path.exists(os.path.join(fp_dir, f'{vid}.png')): continue
        img = Image.new('L', (300, 300), 240)
        draw = ImageDraw.Draw(img)
        for r in range(10, 150, 4 + i): draw.ellipse([150-r, 150-r, 150+r, 150+r], outline=60 + i*20, width=2)
        for y in range(20 + i*7, 280, 8 + i*2): draw.line([(30, y), (270, y + (i+1)*3)], fill=80, width=1)
        img.save(os.path.join(fp_dir, f'{vid}.png'))
except Exception as e:
    print('Pillow failed to generate fingerprints:', e)
" 2>/dev/null || true

for i in 1 2 3; do
    VID="V00${i}"
    curl -s -X POST "http://localhost:8080/api/auth/register" -H "Content-Type: application/json" -d "{\"fullName\": \"Test Voter ${i}\", \"email\": \"voter${i}@test.com\", \"voterId\": \"${VID}\", \"phone\": \"+91900000000${i}\", \"password\": \"password123\"}" >/dev/null 2>&1
    docker exec fabric-cli peer chaincode invoke -o orderer.election.example.com:7050 -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" -c "{\"function\":\"registerVoter\",\"Args\":[\"${VID}\"]}" --tls --cafile "${ORDERER_CA}" --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles "${PEER_TLS}" >/dev/null 2>&1 || true
done
for CID in 1 2 3 4; do
    docker exec fabric-cli peer chaincode invoke -o orderer.election.example.com:7050 -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" -c "{\"function\":\"registerCandidate\",\"Args\":[\"${CID}\",\"Candidate ${CID}\"]}" --tls --cafile "${ORDERER_CA}" --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles "${PEER_TLS}" >/dev/null 2>&1 || true
done

echo -e "\033[0;32mSeeding Complete! Monitoring system...\033[0m"
sleep 2
watch -n 5 "echo '=== Fabric Containers ===' && docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'NAME|fabric|peer|orderer|couchdb' && echo '' && echo '=== Fingerprints Enrolled ===' && ls ${PROJECT_DIR}/backend-ml/data/fingerprints/ 2>/dev/null || echo 'none'"
EOF
chmod +x /tmp/seed_votechain.sh


# ══════════════════════════════════════════════════════════════════════
#  START TMUX
# ══════════════════════════════════════════════════════════════════════

echo "Launching tmux panes..."
tmux new-session -d -s "$SESSION" -x 220 -y 50
tmux rename-window -t "$SESSION:0" "VoteChain"

# Split layout:
# 1. Start with Pane 0
# 2. Split horizontally (creates Pane 1 on right)
tmux split-window -h -t "$SESSION:0"
# 3. Split Pane 0 vertically (creates Pane 1 below 0, moves right pane to 2)
tmux split-window -v -t "$SESSION:0.0"
# 4. Split Pane 2 vertically (creates Pane 3 below 2)
tmux split-window -v -t "$SESSION:0.2"

# Force perfectly equal rectangles
tmux select-layout -t "$SESSION:0" tiled

# Pane 0 (Top-Left): Seeding & Docker Status
tmux send-keys -t "$SESSION:0.0" "clear; echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'; echo '  Pane 0 — Setup & Fabric Docker Status'; echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'; /tmp/seed_votechain.sh" Enter

# Pane 1 (Bottom-Left): Spring Boot Backend
tmux send-keys -t "$SESSION:0.1" "
clear
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
echo '  Pane 1 — Spring Boot Backend  :8080'
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
cd ${BACKEND_DIR}
export DATABASE_URL=\"jdbc:postgresql://localhost:5432/${DB_NAME}\"
export DB_USERNAME=\"${DB_USER}\"
export DB_PASSWORD=\"${DB_PASS}\"
export JWT_SECRET=\"votechainsecretkey1234567890123456\"
export JWT_EXPIRATION=\"86400000\"
export ML_SERVICE_URL=\"http://localhost:5000\"
export FABRIC_PEER_ENDPOINT=\"localhost:7051\"
export FABRIC_CERT_PATH=\"${CRYPTO_DIR}/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts\"
export FABRIC_KEY_PATH=\"${CRYPTO_DIR}/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore\"
export FABRIC_TLS_CERT_PATH=\"${CRYPTO_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\"
./mvnw spring-boot:run -q
" Enter

# Pane 2 (Top-Right): ML Fingerprint Service
tmux send-keys -t "$SESSION:0.2" "
clear
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
echo '  Pane 2 — ML Fingerprint Service  :5000'
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
cd ${ML_DIR}
if [ ! -d \"venv\" ]; then python3 -m venv venv; fi
source venv/bin/activate
pip install -r requirements.txt --quiet 2>/dev/null
uvicorn api.main:app --host 0.0.0.0 --port 5000 --reload
" Enter

# Pane 3 (Bottom-Right): React Frontend
tmux send-keys -t "$SESSION:0.3" "
clear
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
echo '  Pane 3 — React Frontend  :3000'
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
cd ${FRONTEND_DIR}
if [ ! -d \"node_modules\" ]; then npm install --silent 2>/dev/null; fi
HOST=0.0.0.0 \
REACT_APP_API_URL=http://${SERVER_IP}:8080 \
REACT_APP_ML_URL=http://${SERVER_IP}:5000 \
BROWSER=none \
npm start
" Enter

echo "VoteChain tmux session started! Attaching..."
sleep 1
tmux attach-session -t "$SESSION"
