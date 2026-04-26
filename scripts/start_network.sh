#!/bin/bash
# ── Start Hyperledger Fabric Network (Simplified) ────────────────────
# Single-org setup: 1 orderer, 1 peer, 1 CouchDB
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - Hyperledger Fabric binaries (cryptogen, configtxgen, peer) in PATH
#     Download: curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh && ./install-fabric.sh binary
#   - Chaincode built: cd chaincode && mvn clean package
# ─────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
NETWORK_DIR="${PROJECT_DIR}/network"
DOCKER_DIR="${PROJECT_DIR}/docker"
CHAINCODE_DIR="${PROJECT_DIR}/chaincode"
CRYPTO_DIR="${NETWORK_DIR}/crypto-config"
CHANNEL_ARTIFACTS="${NETWORK_DIR}/channel-artifacts"

CHANNEL_NAME="electionchannel"
CHAINCODE_NAME="voting"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE=1

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     VoteChain — Fabric Network Setup (Simplified)       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Generate crypto material ─────────────────────────
echo "── Step 1: Generating crypto material..."
mkdir -p "${CRYPTO_DIR}"
cd "${NETWORK_DIR}"

if [ -d "${CRYPTO_DIR}/peerOrganizations" ]; then
    echo "   Crypto material already exists. Skipping."
    echo "   To regenerate: rm -rf ${CRYPTO_DIR} && re-run"
else
    cryptogen generate --config="${NETWORK_DIR}/crypto-config.yaml" --output="${CRYPTO_DIR}"
    echo "   ✓ Crypto material generated"
fi

# ── Step 2: Generate channel artifacts ────────────────────────
echo ""
echo "── Step 2: Generating channel artifacts..."
mkdir -p "${CHANNEL_ARTIFACTS}"
export FABRIC_CFG_PATH="${NETWORK_DIR}"

if [ ! -f "${CHANNEL_ARTIFACTS}/genesis.block" ]; then
    configtxgen -profile ElectionOrdererGenesis \
        -channelID system-channel \
        -outputBlock "${CHANNEL_ARTIFACTS}/genesis.block"
    echo "   ✓ Genesis block generated"
else
    echo "   Genesis block exists. Skipping."
fi

if [ ! -f "${CHANNEL_ARTIFACTS}/${CHANNEL_NAME}.tx" ]; then
    configtxgen -profile ElectionChannel \
        -outputCreateChannelTx "${CHANNEL_ARTIFACTS}/${CHANNEL_NAME}.tx" \
        -channelID "${CHANNEL_NAME}"
    echo "   ✓ Channel transaction generated"
else
    echo "   Channel transaction exists. Skipping."
fi

# Anchor peer update for Org1
if [ ! -f "${CHANNEL_ARTIFACTS}/Org1MSPanchors.tx" ]; then
    configtxgen -profile ElectionChannel \
        -outputAnchorPeersUpdate "${CHANNEL_ARTIFACTS}/Org1MSPanchors.tx" \
        -channelID "${CHANNEL_NAME}" \
        -asOrg Org1MSP
    echo "   ✓ Anchor peer update for Org1MSP"
fi

# ── Step 3: Start Fabric network ─────────────────────────────
echo ""
echo "── Step 3: Starting Fabric network..."
cd "${DOCKER_DIR}"
docker-compose -f docker-compose-network.yml up -d
echo "   ✓ Fabric network started"

echo "   Waiting for containers to be ready..."
sleep 10

# ── Step 4: Create and join channel ──────────────────────────
echo ""
echo "── Step 4: Creating and joining channel '${CHANNEL_NAME}'..."

docker exec fabric-cli peer channel create \
    -o orderer.election.example.com:7050 \
    -c "${CHANNEL_NAME}" \
    -f "/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.tx" \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/election.example.com/orderers/orderer.election.example.com/msp/tlscacerts/tlsca.election.example.com-cert.pem

echo "   ✓ Channel created"

# Join Org1 peer
echo "   Joining peer0.org1..."
docker exec fabric-cli peer channel join -b "${CHANNEL_NAME}.block"
echo "   ✓ Peer joined channel"

# ── Step 5: Build and deploy chaincode ────────────────────────
echo ""
echo "── Step 5: Building and deploying chaincode..."

if [ ! -f "${CHAINCODE_DIR}/target/voting-chaincode-1.0.0.jar" ]; then
    echo "   Building chaincode with Maven..."
    cd "${CHAINCODE_DIR}"
    mvn clean package -DskipTests
    echo "   ✓ Chaincode built"
else
    echo "   Chaincode JAR exists. Skipping build."
fi

# Package chaincode
echo "   Packaging chaincode..."
docker exec fabric-cli peer lifecycle chaincode package \
    "${CHAINCODE_NAME}.tar.gz" \
    --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode \
    --lang java \
    --label "${CHAINCODE_NAME}_${CHAINCODE_VERSION}"

# Install on Org1 peer
echo "   Installing chaincode on peer0.org1..."
docker exec fabric-cli peer lifecycle chaincode install "${CHAINCODE_NAME}.tar.gz"

# Get package ID
PACKAGE_ID=$(docker exec fabric-cli peer lifecycle chaincode queryinstalled 2>&1 | grep "${CHAINCODE_NAME}_${CHAINCODE_VERSION}" | awk -F'[, ]+' '{print $3}')
echo "   Package ID: ${PACKAGE_ID}"

# Approve for Org1
echo "   Approving chaincode for Org1..."
docker exec fabric-cli peer lifecycle chaincode approveformyorg \
    -o orderer.election.example.com:7050 \
    --channelID "${CHANNEL_NAME}" \
    --name "${CHAINCODE_NAME}" \
    --version "${CHAINCODE_VERSION}" \
    --package-id "${PACKAGE_ID}" \
    --sequence ${CHAINCODE_SEQUENCE} \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/election.example.com/orderers/orderer.election.example.com/msp/tlscacerts/tlsca.election.example.com-cert.pem

# Commit chaincode
echo "   Committing chaincode definition..."
docker exec fabric-cli peer lifecycle chaincode commit \
    -o orderer.election.example.com:7050 \
    --channelID "${CHANNEL_NAME}" \
    --name "${CHAINCODE_NAME}" \
    --version "${CHAINCODE_VERSION}" \
    --sequence ${CHAINCODE_SEQUENCE} \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/election.example.com/orderers/orderer.election.example.com/msp/tlscacerts/tlsca.election.example.com-cert.pem \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  ✓ Fabric network is running!"
echo "  ✓ Channel '${CHANNEL_NAME}' created and joined"
echo "  ✓ Chaincode '${CHAINCODE_NAME}' deployed and committed"
echo ""
echo "  Next steps:"
echo "    1. Run scripts/seed_data.sh"
echo "    2. Run scripts/start_ml.sh"
echo "    3. Run scripts/start_backend.sh"
echo "    4. Run scripts/start_frontend.sh"
echo "══════════════════════════════════════════════════════════"
