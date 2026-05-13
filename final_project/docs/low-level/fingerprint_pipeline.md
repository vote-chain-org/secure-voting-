# 6-Gate Biometric Verification Pipeline

This document details the high-security biometric fingerprint pipeline implemented in the VoteChain distributed system.

## 1. Overview

The fingerprint pipeline has been fully refactored to eliminate client-side biometric processing vulnerabilities. The system now utilizes a server-side 6-Gate verification flow, leveraging the SecuGen FDx SDK Pro for Linux, a custom CNN liveness detection model, and a minutiae-based matcher.

The primary goal is to ensure that a voter's identity is strictly tied to their physical fingerprint. The `voterId` used to record the vote on the blockchain is securely retrieved via the authentication token and matched against the biometric database in a 1:1 verification model.

## 2. The 6-Gate Pipeline

When a voter attempts to cast a vote, the following gates must be passed sequentially. Failure at any gate results in immediate rejection of the vote.

### Gate 1: Session Identity Verification
- The voter must be logged in. The frontend extracts the `voterId` tied to their active session (JWT).
- **Security Check:** Prevents unauthenticated biometric submissions. The `voterId` dictates which template is retrieved for 1:1 matching.

### Gate 2: Liveness Detection (CNN)
- The raw base64 fingerprint image is converted to a temporary PNG on the Spring Boot server and forwarded to the ML service.
- The ML service runs the image through a pre-trained ResNet-18 model.
- **Security Check:** `liveness_score >= 0.85` (Configurable). Prevents spoofing using printed, silicon, or replay attacks.

### Gate 3: Structural Minutiae Match (Gabor Filter)
- The ML service performs ridge enhancement using Gabor filters and extracts minutiae points (bifurcations and ridge endings).
- The extracted features are compared against the enrolled image.
- **Security Check:** `match_score >= 0.50` (Configurable). Provides an initial topological validation before invoking the strict SDK matcher.

### Gate 4: High-Security SDK Template Match
- The raw image is passed to the SecuGen FDx SDK (via Python bindings).
- The SDK extracts an ISO/SG400 template and performs a 1:1 match against the previously enrolled template.
- **Security Check:** `sdk_score >= 165` (SecuGen "High Security" threshold). This is the definitive biometric match.

### Gate 5: Double-Vote Prevention (Database Check)
- If the biometric match succeeds, the Spring Boot backend queries the PostgreSQL `votes` table.
- **Security Check:** Checks `EXISTS(voterId, electionId)`. Prevents a verified user from voting twice in the same election.

### Gate 6: Immutable Blockchain Ledger
- The final verified `voterId` and `candidateId` are submitted to the Hyperledger Fabric network via the Fabric Gateway.
- The chaincode executes its own internal state checks before appending the transaction to the ledger.
- **Security Check:** The blockchain ensures that the vote tally is immutable and provides an audited transaction ID (`txHash`).

## 3. Data Flow Architecture

1. **Scanner Service (Windows Booth)**
   - Hardware: SecuGen Hamster Pro 20 (HU20).
   - Captures raw 8-bit grayscale pixel bytes.
   - Responds to the frontend with `rawBase64`, `width`, and `height`.
   - **Crucially:** Performs NO templating or BMP wrapping.

2. **Frontend (React)**
   - Formats the raw data and user session token into a multipart request.
   - Sends the request to the Spring Boot backend.

3. **Backend (Spring Boot)**
   - Reconstructs a temporary PNG from the raw bytes (to satisfy the Python ML service requirements).
   - Orchestrates the verification flow by acting as the secure middleman between the frontend, the ML service, PostgreSQL, and the Fabric network.

4. **ML Service (Python/FastAPI)**
   - Houses the ResNet model and SecuGen `.so` bindings.
   - Handles `/enroll` (called securely from Spring Boot during registration) and `/verify` (1:1 match).

## 4. Maintenance & Operations

- **SDK Installation:** The server hosting the ML service MUST run `sudo ./setup_sdk.sh` to install the `libsgfplib.so` dependencies.
- **Model Files:** The `liveness_model.pth` must be present in the `backend-ml/src/` directory.
- **Threshold Tuning:** The `LIVENESS_THRESHOLD` and `MATCH_THRESHOLD` can be adjusted via environment variables in the ML service. The SDK score threshold (165) is hardcoded in the Spring Boot `VoteService`.
