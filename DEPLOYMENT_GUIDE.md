# VoteChain — Comprehensive Server Deployment Guide

This guide walks you through deploying the entire VoteChain system on a single Ubuntu/Linux server from scratch. Every step is explained.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [What Runs Where](#2-what-runs-where)
3. [Server Prerequisites](#3-server-prerequisites)
4. [Step 1: Install System Dependencies](#step-1-install-system-dependencies)
5. [Step 2: Set Up PostgreSQL](#step-2-set-up-postgresql)
6. [Step 3: Install Hyperledger Fabric Binaries](#step-3-install-hyperledger-fabric-binaries)
7. [Step 4: Start the Fabric Blockchain Network](#step-4-start-the-fabric-blockchain-network)
8. [Step 5: Start the ML Fingerprint Service](#step-5-start-the-ml-fingerprint-service)
9. [Step 6: Build & Start the Spring Boot Backend](#step-6-build--start-the-spring-boot-backend)
10. [Step 7: Seed Test Data](#step-7-seed-test-data)
11. [Step 8: Build & Serve the React Frontend](#step-8-build--serve-the-react-frontend)
12. [Step 9: Verify Everything Works](#step-9-verify-everything-works)
13. [Accessing from Other Machines (Booths)](#10-accessing-from-other-machines-booths)
14. [Troubleshooting](#troubleshooting)
15. [Stopping Everything](#stopping-everything)
16. [Full Architecture Diagram](#full-architecture-diagram)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVER MACHINE                                │
│                                                                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────────┐│
│  │ React Frontend│  │ Spring Boot      │  │ Hyperledger Fabric         ││
│  │ (Port 3000)   │  │ Backend          │  │                            ││
│  │               │  │ (Port 8080)      │  │  Orderer    (Port 7050)    ││
│  │  Serves UI    │──│                  │──│  Peer       (Port 7051)    ││
│  │  to browsers  │  │  Auth + Votes    │  │  CouchDB    (Port 5984)    ││
│  └──────────────┘  │  Fabric Gateway  │  │  CLI Container             ││
│                     │  ML Client       │  └────────────────────────────┘│
│                     └────────┬─────────┘                                │
│                              │                                          │
│                     ┌────────▼─────────┐  ┌──────────────┐             │
│                     │ ML Service       │  │ PostgreSQL   │             │
│                     │ (Port 5000)      │  │ (Port 5432)  │             │
│                     │ FastAPI + OpenCV │  │ User & Vote  │             │
│                     │ Fingerprint Match│  │ data         │             │
│                     └──────────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
         ▲
         │  HTTP (browser)
         │
┌────────┴────────┐
│  Client Machine  │
│  (Voting Booth)  │
│  Just a browser  │
│  pointing to     │
│  http://<SERVER>  │
│  :3000           │
└─────────────────┘
```

**Everything runs on one server.** Voting booths are just browsers on any machine pointing to the server's IP.

---

## 2. What Runs Where

| Component | Technology | Port | How It Runs |
|-----------|-----------|------|-------------|
| **Fabric Network** | Docker containers | 7050, 7051, 5984 | `docker-compose up` |
| **PostgreSQL** | System service | 5432 | `systemctl` (already installed or via Docker) |
| **ML Service** | Python FastAPI | 5000 | `uvicorn` in a virtualenv |
| **Backend** | Java Spring Boot | 8080 | `./mvnw spring-boot:run` |
| **Frontend** | React (Node.js) | 3000 | `npm start` (dev) or `serve` (prod) |

**You need 5 terminal windows** (or use `tmux`/`screen` to run in background).

---

## 3. Server Prerequisites

Minimum specs:
- **OS**: Ubuntu 20.04+ / Debian 11+ / any Linux with Docker
- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk**: 10 GB free
- **Ports open**: 3000, 5000, 7050, 7051, 8080 (for external access)

---

## Step 1: Install System Dependencies

### 1.1 — Update system
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 — Install Java 17
```bash
sudo apt install -y openjdk-17-jdk
java -version
# Should show: openjdk version "17.x.x"
```

### 1.3 — Install Maven
```bash
sudo apt install -y maven
mvn -version
```

### 1.4 — Install Node.js 18+ and npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # Should show v18.x.x
npm -v    # Should show 9.x.x or higher
```

### 1.5 — Install Python 3.9+
```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version
```

### 1.6 — Install Docker and Docker Compose
```bash
# Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker $USER
# LOG OUT AND LOG BACK IN for group change to take effect

# Docker Compose
sudo apt install -y docker-compose

# Verify
docker --version
docker-compose --version
```

### 1.7 — Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-client
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## Step 2: Set Up PostgreSQL

```bash
# Switch to postgres user and create the database
sudo -u postgres psql
```

Inside the PostgreSQL shell:
```sql
-- Create the database
CREATE DATABASE votechain;

-- Set password for postgres user (used by our backend)
ALTER USER postgres PASSWORD 'postgres';

-- Verify
\l
-- You should see 'votechain' in the list

-- Exit
\q
```

**What this does:** Creates the `votechain` database where Spring Boot will store user accounts and vote receipts. The backend uses `spring.jpa.hibernate.ddl-auto=update` so tables are created automatically on first run.

---

## Step 3: Install Hyperledger Fabric Binaries

These are the CLI tools (`cryptogen`, `configtxgen`, `peer`) needed to set up the blockchain network.

```bash
# Go to your project directory
cd /path/to/final_project

# Download Fabric binaries (this downloads ~200MB)
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh
chmod +x install-fabric.sh
./install-fabric.sh binary

# This creates a bin/ directory with the tools.
# Add to PATH:
export PATH=$PATH:$(pwd)/bin

# Verify
cryptogen version
configtxgen -version
peer version
```

> **Tip:** Add the PATH export to your `~/.bashrc` so it persists:
> ```bash
> echo 'export PATH=$PATH:/path/to/final_project/bin' >> ~/.bashrc
> source ~/.bashrc
> ```

**What this does:** Downloads the Fabric binary tools that generate crypto certificates and channel configuration. These tools are NOT Docker containers — they run natively on your server.

---

## Step 4: Start the Fabric Blockchain Network

This is the most complex step. It does 5 things:

```
1. Generate crypto certificates (TLS certs, signing keys for Org1)
2. Generate genesis block (the first block of the blockchain)
3. Start Docker containers (orderer, peer, CouchDB, CLI)
4. Create the "electionchannel" and have the peer join it
5. Build, install, approve, and commit the voting chaincode
```

### 4.1 — Build the chaincode first
```bash
cd /path/to/final_project/chaincode
mvn clean package -DskipTests
```

This produces `target/voting-chaincode-1.0.0.jar`.

### 4.2 — Run the network start script
```bash
cd /path/to/final_project
./scripts/start_network.sh
```

### What each step does (for comprehension):

**Step 1 — Crypto generation (`cryptogen`):**
```
Reads: network/crypto-config.yaml
Creates: network/crypto-config/
  ├── ordererOrganizations/election.example.com/    ← orderer's certs
  └── peerOrganizations/org1.example.com/           ← Org1's certs
       ├── peers/peer0.org1.example.com/
       │    ├── msp/    ← identity (signing cert)
       │    └── tls/    ← TLS cert for encrypted communication
       └── users/User1@org1.example.com/
            └── msp/    ← the identity Spring Boot uses to sign transactions
```

**Step 2 — Channel artifacts (`configtxgen`):**
```
Reads: network/configtx.yaml
Creates: network/channel-artifacts/
  ├── genesis.block           ← first block of the system channel
  └── electionchannel.tx      ← transaction to create the election channel
```

**Step 3 — Docker containers:**
```
docker-compose -f docker/docker-compose-network.yml up -d

Starts 4 containers:
  orderer.election.example.com  → blockchain ordering service (port 7050)
  peer0.org1.example.com        → stores the ledger, runs chaincode (port 7051)
  couchdb0                      → world state database for the peer (port 5984)
  fabric-cli                    → admin CLI for running peer commands
```

**Step 4 — Channel creation:**
```
Creates "electionchannel" and has peer0.org1 join it.
This is the channel where all votes will be recorded.
```

**Step 5 — Chaincode deployment:**
```
1. Package the Java chaincode into a tar.gz
2. Install it on the peer
3. Approve it for Org1
4. Commit the chaincode definition to the channel
After this, the voting smart contract is live and callable.
```

### 4.3 — Verify it's running
```bash
# Check Docker containers
docker ps

# You should see 4 containers:
# orderer.election.example.com
# peer0.org1.example.com
# couchdb0
# fabric-cli

# Check if chaincode is committed
docker exec fabric-cli peer lifecycle chaincode querycommitted \
  -C electionchannel -n voting
```

---

## Step 5: Start the ML Fingerprint Service

**Terminal 1:**
```bash
cd /path/to/final_project
./scripts/start_ml.sh
```

This does:
1. Creates a Python virtualenv in `backend-ml/venv/`
2. Installs FastAPI, OpenCV, uvicorn
3. Starts the ML API on `http://localhost:5000`

### Verify:
```bash
curl http://localhost:5000/health
# {"status":"ok","enrolled_fingerprints":0}
```

**How it works:** The ML service stores enrolled fingerprints as PNG files in `backend-ml/data/fingerprints/`. When `/verify` is called, it compares the uploaded image against all stored images using OpenCV ORB feature matching and returns the best-matching voter_id.

---

## Step 6: Build & Start the Spring Boot Backend

**Terminal 2:**
```bash
cd /path/to/final_project
./scripts/start_backend.sh
```

This does:
1. Sets environment variables (DATABASE_URL, JWT_SECRET, Fabric paths, ML URL)
2. Runs `./mvnw spring-boot:run`
3. Spring Boot:
   - Connects to PostgreSQL → auto-creates `users` and `votes` tables
   - Initializes `FabricService` → connects to peer via gRPC with TLS
   - Initializes `MlClientService` → configured to call ML on port 5000

### Wait for this line in the log:
```
Started BackendApplication in X.XXX seconds
Fabric Gateway connected — channel=electionchannel, chaincode=voting
```

### Verify:
```bash
curl http://localhost:8080/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
# Should return 401 or error (no users yet) — that's fine, server is running
```

**How Fabric connection works:**
```
FabricService.init():
  1. Loads User1@org1's signing certificate from:
     network/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/
  2. Loads private key from:
     network/crypto-config/.../keystore/
  3. Loads TLS CA cert from:
     network/crypto-config/.../peers/peer0.org1.example.com/tls/ca.crt
  4. Creates gRPC channel to localhost:7051 with TLS
  5. Builds Gateway with identity "Org1MSP"
  6. Gets reference to electionchannel → voting contract
```

---

## Step 7: Seed Test Data

**Terminal 3 (one-time):**
```bash
cd /path/to/final_project
./scripts/seed_data.sh
```

This registers in **three systems simultaneously**:

| System | What's Registered | How |
|--------|-------------------|-----|
| **PostgreSQL** | 3 user accounts (V001, V002, V003) | `curl POST /api/auth/register` |
| **ML Service** | 3 fingerprint images | Saves PNGs to `data/fingerprints/` |
| **Blockchain** | 3 voters + 4 candidates | `docker exec peer chaincode invoke` |

### Test accounts created:

| Voter ID | Email | Password | Fingerprint File |
|----------|-------|----------|-----------------|
| V001 | voter1@test.com | password123 | `backend-ml/data/fingerprints/V001.png` |
| V002 | voter2@test.com | password123 | `backend-ml/data/fingerprints/V002.png` |
| V003 | voter3@test.com | password123 | `backend-ml/data/fingerprints/V003.png` |

---

## Step 8: Build & Serve the React Frontend

### Option A: Development mode (easiest)

**Terminal 4:**
```bash
cd /path/to/final_project
./scripts/start_frontend.sh
```

This runs the React dev server on port 3000 with hot-reload.

### Option B: Production build (for real deployment)

```bash
cd /path/to/final_project/frontend

# Set the API URL to your server's IP (not localhost!)
export REACT_APP_API_URL=http://<YOUR_SERVER_IP>:8080

# Build production bundle
npm run build

# Serve with a static file server
sudo npm install -g serve
serve -s build -l 3000
```

### For external access:
If voting booths (browsers) are on other machines, the frontend needs to know the server's real IP:

```bash
# Find your server IP
hostname -I
# Example: 192.168.1.100

# Set it before building/running frontend
export REACT_APP_API_URL=http://192.168.1.100:8080
```

---

## Step 9: Verify Everything Works

### 9.1 — Quick health checks
```bash
# ML Service
curl http://localhost:5000/health
# ✓ {"status":"ok","enrolled_fingerprints":3}

# Backend
curl http://localhost:8080/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"voter1@test.com","password":"password123"}'
# ✓ Should return {"token":"...","email":"voter1@test.com",...}

# Blockchain
docker exec fabric-cli peer chaincode query \
  -C electionchannel -n voting \
  -c '{"function":"getResults","Args":[]}'
# ✓ Should return results JSON (0 votes initially)

# Frontend
curl -s http://localhost:3000 | head -5
# ✓ Should return HTML
```

### 9.2 — End-to-end vote test via curl
```bash
# Cast a vote using fingerprint file
curl -X POST http://localhost:8080/api/votes/cast \
  -F "fingerprint=@backend-ml/data/fingerprints/V001.png" \
  -F "candidateId=1" \
  -F "electionId=1" \
  -F "electionTitle=Test Election" \
  -F "region=Test Region" \
  -F "status=Live"

# ✓ Expected response:
# {"status":"success","txHash":"abc123...real_fabric_tx_id...","voterId":"V001"}
```

### 9.3 — End-to-end via browser
1. Open `http://<SERVER_IP>:3000`
2. Click **Login to Vote**
3. Login: `voter1@test.com` / `password123`
4. Click on an election
5. Click **Vote** on a candidate
6. Enter anything for eligibility check → Continue
7. Click **Upload Fingerprint Image** → select `backend-ml/data/fingerprints/V001.png`
8. Click **Verify & Vote**
9. ✅ "Vote Recorded!" with blockchain transaction ID

### 9.4 — Verify double-vote prevention
Try voting again with V001.png → Should get: "You have already voted in this election"

---

## 10. Accessing from Other Machines (Booths)

A "booth" is just **any machine with a web browser**. No software installation needed.

### On the server:
Make sure ports are accessible (if firewall is active):
```bash
sudo ufw allow 3000/tcp   # Frontend
sudo ufw allow 8080/tcp   # Backend API
```

### On the booth machine:
1. Open Chrome/Firefox
2. Navigate to `http://<SERVER_IP>:3000`
3. That's it — the user can now log in and vote

### If on a different network (e.g., booth on WiFi, server on LAN):
- Ensure both machines can reach each other (same network or port forwarding)
- Use the server's LAN IP (e.g., `192.168.1.100`) not `localhost`

---

## Troubleshooting

### "Fabric Gateway connection failed"
```bash
# Check Docker containers are running
docker ps
# If not running:
cd docker && docker-compose -f docker-compose-network.yml up -d

# Check peer logs
docker logs peer0.org1.example.com --tail 20
```

### "ML service unavailable"
```bash
# Check if ML is running
curl http://localhost:5000/health
# If not:
cd backend-ml && source venv/bin/activate && uvicorn api.main:app --port 5000
```

### "Database connection refused"
```bash
# Check PostgreSQL
sudo systemctl status postgresql
# Check database exists
sudo -u postgres psql -l | grep votechain
```

### "Fingerprint not recognized"
```bash
# Check enrolled fingerprints
curl http://localhost:5000/health
# Should show enrolled_fingerprints: 3
# If 0, re-run seed script:
./scripts/seed_data.sh
```

### "Cannot find crypto material"
```bash
# Check crypto-config exists
ls network/crypto-config/peerOrganizations/org1.example.com/
# If missing, re-run:
./scripts/start_network.sh
```

### Backend won't compile
```bash
cd backend && ./mvnw compile -U
# The -U flag forces Maven to re-download dependencies
```

---

## Stopping Everything

```bash
# 1. Stop Frontend (Ctrl+C in its terminal)
# 2. Stop Backend (Ctrl+C in its terminal)
# 3. Stop ML Service (Ctrl+C in its terminal)

# 4. Stop Fabric network and clean up
./scripts/stop_network.sh

# 5. (Optional) Stop PostgreSQL
sudo systemctl stop postgresql
```

---

## Full Architecture Diagram

```
┌────────────────── COMPLETE VOTE FLOW ──────────────────┐
│                                                         │
│  BROWSER (any machine)                                  │
│  │                                                      │
│  │ 1. User selects candidate                            │
│  │ 2. User uploads fingerprint PNG                      │
│  │ 3. POST /api/votes/cast                              │
│  │    Body: { fingerprint: <file>, candidateId: "1" }   │
│  │    NOTE: No voterId sent!                            │
│  ▼                                                      │
│  SPRING BOOT BACKEND (port 8080)                        │
│  │                                                      │
│  │ 4. Forward fingerprint → ML Service                  │
│  │    POST http://localhost:5000/verify                  │
│  │    Body: { fingerprint: <file> }                     │
│  ▼                                                      │
│  ML SERVICE (port 5000)                                 │
│  │                                                      │
│  │ 5. Compare fingerprint against enrolled images       │
│  │    using OpenCV ORB feature matching                 │
│  │ 6. Return: { "voter_id": "V001", "score": 0.85 }    │
│  │    or:     { "voter_id": null,   "score": 0.0 }     │
│  ▼                                                      │
│  SPRING BOOT (continued)                                │
│  │                                                      │
│  │ 7. If voter_id == null → REJECT                      │
│  │                                                      │
│  │ 8. Check PostgreSQL:                                 │
│  │    - User with voterId="V001" exists? ✓              │
│  │    - Already voted in this election? ✗               │
│  │                                                      │
│  │ 9. Submit to Fabric blockchain:                      │
│  │    castVerifiedVote("V001", "1")                     │
│  │    via gRPC → peer0.org1:7051                        │
│  ▼                                                      │
│  HYPERLEDGER FABRIC (Docker containers)                 │
│  │                                                      │
│  │ 10. Chaincode validates:                             │
│  │     - Voter "V001" registered on ledger? ✓           │
│  │     - Voter "V001" already voted? ✗                  │
│  │     - Candidate "1" exists? ✓                        │
│  │ 11. Records vote on immutable ledger                 │
│  │ 12. Returns transaction ID                           │
│  ▼                                                      │
│  SPRING BOOT (continued)                                │
│  │                                                      │
│  │ 13. Save vote + txId to PostgreSQL                   │
│  │ 14. Return to browser:                               │
│  │     { status: "success", txHash: "a1b2c3..." }      │
│  ▼                                                      │
│  BROWSER                                                │
│  │                                                      │
│  │ 15. Display "Vote Recorded!" + transaction ID        │
│  └                                                      │
│                                                         │
│  SAFETY NET CHAIN:                                      │
│  ML (identity) → Backend DB (existence + uniqueness)    │
│                 → Chaincode (final guard on ledger)     │
└─────────────────────────────────────────────────────────┘
```

---

## Terminal Layout (using tmux)

If you prefer running everything in one SSH session:

```bash
# Install tmux
sudo apt install -y tmux

# Start tmux
tmux

# Split into 4 panes:
# Ctrl+B, then "   → split horizontal
# Ctrl+B, then %   → split vertical
# Ctrl+B, then arrow keys → navigate between panes

# Pane 1: ML Service
./scripts/start_ml.sh

# Pane 2: Backend
./scripts/start_backend.sh

# Pane 3: Frontend
./scripts/start_frontend.sh

# Pane 4: Commands / monitoring
docker ps
curl http://localhost:5000/health
```

---

## Quick Reference — All Commands in Order

```bash
# === ONE-TIME SETUP ===
# 1. Install deps (Java, Node, Python, Docker, PostgreSQL)
# 2. Create database
sudo -u postgres psql -c "CREATE DATABASE votechain;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
# 3. Install Fabric binaries
./install-fabric.sh binary && export PATH=$PATH:$(pwd)/bin
# 4. Build chaincode
cd chaincode && mvn clean package -DskipTests && cd ..

# === EVERY TIME YOU START ===
# 5. Start Fabric (if not already running)
./scripts/start_network.sh
# 6. Start ML (Terminal 1)
./scripts/start_ml.sh
# 7. Start Backend (Terminal 2)
./scripts/start_backend.sh
# 8. Seed data (first time only, Terminal 3)
./scripts/seed_data.sh
# 9. Start Frontend (Terminal 3/4)
./scripts/start_frontend.sh

# === SHUTDOWN ===
# Ctrl+C on ML, Backend, Frontend terminals
./scripts/stop_network.sh
```
