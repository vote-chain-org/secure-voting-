# VoteChain — Secure Blockchain Voting Prototype

A simplified, end-to-end blockchain voting system with fingerprint-based voter verification.

## Architecture

```
┌─────────────┐     ┌─────────────────────┐     ┌───────────────┐     ┌──────────────────────┐
│   Frontend   │────▶│  Spring Boot Backend │────▶│  ML Service   │     │ Hyperledger Fabric   │
│  (React)     │◀────│  (Java 17)           │◀────│  (FastAPI)    │     │ (Blockchain)         │
│  Port: 3000  │     │  Port: 8080          │     │  Port: 5000   │     │ Peer: 7051           │
└─────────────┘     └──────────┬───────────┘     └───────────────┘     │ Orderer: 7050        │
                               │                                       └──────────┬───────────┘
                               │                                                  │
                               └──────────────────────────────────────────────────┘
                                        Fabric Gateway SDK (gRPC)
```

### Components

| Component | Technology | Port | Purpose |
|-----------|-----------|------|---------|
| **Frontend** | React + Lucide Icons | 3000 | User interface, election browsing, vote casting |
| **Backend** | Spring Boot 3.4 + JPA | 8080 | Auth, vote orchestration, Fabric Gateway, PostgreSQL |
| **ML Service** | FastAPI + OpenCV | 5000 | Fingerprint enrollment and verification |
| **Blockchain** | Hyperledger Fabric 2.5 | 7051 | Immutable vote ledger, prevents double-voting |
| **Database** | PostgreSQL | 5432 | User accounts, vote receipts, election metadata |

---

## Voting Flow (End-to-End)

```
User uploads fingerprint + selects candidate
           │
           ▼
┌──── Frontend ─────────────────────────────────────────┐
│  POST /api/votes/cast                                  │
│  FormData: fingerprint (file) + candidateId + electionId│
│  NOTE: No voterId is sent — identity from ML only      │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌──── Backend (VoteService) ────────────────────────────┐
│                                                        │
│  1. Forward fingerprint → ML Service (POST /verify)    │
│     ML returns: { "voter_id": "V001" } or null         │
│                                                        │
│  2. If null → REJECT (fingerprint not recognized)      │
│                                                        │
│  3. Validate in PostgreSQL:                            │
│     - User with voterId exists?                        │
│     - User hasn't voted in this election?              │
│                                                        │
│  4. Submit to Fabric blockchain:                       │
│     castVerifiedVote(voterId, candidateId)             │
│     ← Real txId returned from Fabric Gateway API       │
│                                                        │
│  5. Save Vote record (with txId) to PostgreSQL         │
│                                                        │
│  6. Return { status: "success", txHash: "abc123..." }  │
└───────────────────────────────────────────────────────┘
```

### Safety Net Chain

Identity verification happens at **three levels**:

1. **ML Service** — fingerprint must match an enrolled voter
2. **Backend DB** — voterId must exist in PostgreSQL, voter must not have already voted
3. **Chaincode** — Fabric smart contract enforces voter existence and prevents double-voting on-chain

### Critical Design Rule

> **Voter identity comes ONLY from ML fingerprint verification, never from the frontend.**
>
> The frontend sends only a fingerprint image file + candidateId. The backend extracts the voterId exclusively from the ML match result. This prevents any frontend manipulation of voter identity.

---

## Prerequisites

- **Java 17+** (for backend and chaincode)
- **Maven 3.8+** (for building Java projects)
- **Node.js 18+** and **npm** (for frontend)
- **Python 3.9+** (for ML service)
- **Docker** and **Docker Compose** (for Hyperledger Fabric)
- **PostgreSQL 14+** (for user/vote data)
- **Hyperledger Fabric binaries** (cryptogen, configtxgen, peer)

### Installing Fabric Binaries

```bash
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh
chmod +x install-fabric.sh
./install-fabric.sh binary
export PATH=$PATH:$(pwd)/bin
```

### Setting Up PostgreSQL

```bash
sudo -u postgres psql -c "CREATE DATABASE votechain;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

---

## Quick Start

### 1. Start Fabric Network

```bash
# Build chaincode first
cd chaincode && mvn clean package -DskipTests && cd ..

# Start network (generates crypto, starts Docker containers, deploys chaincode)
./scripts/start_network.sh
```

### 2. Start ML Service

```bash
./scripts/start_ml.sh
# Creates Python venv, installs deps, runs on port 5000
```

### 3. Start Backend

```bash
./scripts/start_backend.sh
# Sets env vars, runs Spring Boot on port 8080
```

### 4. Seed Test Data

```bash
./scripts/seed_data.sh
# Registers 3 test voters (V001, V002, V003) in:
#   - PostgreSQL (user accounts)
#   - ML service (fingerprint enrollment)
#   - Blockchain (on-chain voter registry)
```

### 5. Start Frontend

```bash
./scripts/start_frontend.sh
# Runs React app on port 3000
```

### 6. Test the System

1. Open `http://localhost:3000`
2. Login with `voter1@test.com` / `password123`
3. Click on an election → Click "Vote" on a candidate
4. Verify eligibility (any input works for prototype)
5. Upload fingerprint image: `backend-ml/data/fingerprints/V001.png`
6. Vote is submitted → txId displayed on screen
7. Check "My Votes" page → vote receipt visible with blockchain txId

---

## Project Structure

```
final_project/
├── backend/                    # Spring Boot backend
│   ├── src/main/java/com/votechain/backend/
│   │   ├── controller/
│   │   │   ├── AuthController.java      # Login/Register endpoints
│   │   │   ├── VoteController.java      # POST /cast (multipart), GET /my
│   │   │   └── AdminController.java     # Admin results endpoints
│   │   ├── service/
│   │   │   ├── VoteService.java         # Core: ML → DB → Fabric flow
│   │   │   ├── FabricService.java       # Fabric Gateway SDK connection
│   │   │   ├── MlClientService.java     # WebClient to ML service
│   │   │   └── AuthService.java         # JWT auth logic
│   │   ├── model/
│   │   │   ├── User.java                # User entity (voterId, email, etc.)
│   │   │   └── Vote.java                # Vote entity (txHash, candidateId, etc.)
│   │   ├── dto/                         # Data transfer objects
│   │   ├── repository/                  # JPA repositories
│   │   └── security/                    # JWT filter, SecurityConfig
│   └── src/main/resources/
│       └── application.properties       # DB, JWT, ML, Fabric config
│
├── backend-ml/                 # Python ML fingerprint service
│   ├── api/main.py             # FastAPI app (enroll, verify, health)
│   ├── src/matcher.py          # ORB feature matching
│   ├── data/fingerprints/      # Enrolled fingerprint PNGs
│   └── requirements.txt
│
├── frontend/                   # React frontend
│   ├── src/pages/
│   │   ├── Homepage.jsx        # Landing page with elections
│   │   ├── ElectionDetail.jsx  # Voting page with fingerprint upload
│   │   ├── LoginPage.jsx       # Login form
│   │   └── SignupPage.jsx      # Registration form
│   └── src/styles/             # CSS files
│
├── chaincode/                  # Hyperledger Fabric smart contract
│   ├── src/main/java/com/voting/chaincode/
│   │   ├── VotingContract.java # registerVoter, castVerifiedVote, getResults
│   │   ├── Voter.java          # Voter state model
│   │   ├── Candidate.java      # Candidate state model
│   │   └── VoteRecord.java     # Vote record model
│   └── pom.xml
│
├── network/                    # Fabric network config
│   ├── crypto-config.yaml      # Single org (Org1) crypto generation
│   └── configtx.yaml           # Channel and org definitions
│
├── docker/
│   └── docker-compose-network.yml  # Fabric Docker: orderer, peer, CouchDB, CLI
│
└── scripts/
    ├── start_network.sh        # Start Fabric network
    ├── stop_network.sh         # Stop and clean Fabric network
    ├── start_backend.sh        # Start Spring Boot
    ├── start_ml.sh             # Start ML service
    ├── start_frontend.sh       # Start React app
    └── seed_data.sh            # Seed test voters, candidates, fingerprints
```

---

## API Reference

### Auth

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{ fullName, email, voterId, phone, password }` | `{ token, email, fullName, role }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, email, fullName, role }` |

### Voting

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/votes/cast` | `multipart: fingerprint (file), candidateId, electionId, electionTitle, region, status, electionImg` | `{ status, txHash, voterId }` |
| GET | `/api/votes/my` | JWT in Authorization header | `[{ id, electionId, electionTitle, txHash, votedAt, ... }]` |

### Admin

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | `/api/admin/results` | JWT (ADMIN role) | Blockchain vote tallies JSON |
| GET | `/api/admin/votes/count` | JWT (ADMIN role) | `{ totalVotes, source }` |

### ML Service

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/enroll` | `multipart: voter_id (form), fingerprint (file)` | `{ status, voter_id }` |
| POST | `/verify` | `multipart: fingerprint (file)` | `{ voter_id, score }` |
| GET | `/health` | — | `{ status, enrolled_fingerprints }` |

### Example: Cast a Vote

```bash
curl -X POST http://localhost:8080/api/votes/cast \
  -F "fingerprint=@backend-ml/data/fingerprints/V001.png" \
  -F "candidateId=1" \
  -F "electionId=1" \
  -F "electionTitle=SPPU Students' Council Election 2025" \
  -F "region=Savitribai Phule Pune University" \
  -F "status=Live"
```

---

## Technical Details

### Fabric Gateway SDK Integration

The backend connects to Hyperledger Fabric using the **Fabric Gateway Java SDK** (`io.github.hyperledger:fabric-gateway:1.4.0`):

1. **Load crypto materials** from `network/crypto-config/` (cert, private key, TLS CA)
2. **Create gRPC channel** to peer with TLS
3. **Build Gateway** with X509 identity and signing key
4. **Submit transactions** using the proposal → endorse → submit workflow
5. **Retrieve real txId** via `SubmittedTransaction.getTransactionId()`

### Fingerprint Matching (6-Gate Pipeline)

The ML service uses a high-security combination of machine learning and SDK integration:

1. **Liveness Detection**: A ResNet-18 model verifies the scan is from a live finger.
2. **Minutiae Match**: Gabor filters and crossing-number algorithms verify ridge topology.
3. **SDK Verification**: The SecuGen FDx SDK extracts an ISO/SG400 template and performs strict 1:1 matching against the enrolled template.
4. Returns a success only if both ML thresholds and SDK strict thresholds are met.

### Chaincode Functions

| Function | Args | Description |
|----------|------|-------------|
| `registerVoter` | `voterID` | Register voter on ledger |
| `registerCandidate` | `candidateID, name` | Register candidate |
| `castVerifiedVote` | `voterID, candidateID` | Record vote (enforces: voter exists, not voted, candidate exists) |
| `getResults` | — | Tally votes per candidate |

---

## Stopping the System

```bash
# Stop Fabric network and clean up
./scripts/stop_network.sh

# Stop other services with Ctrl+C in their respective terminals
```
