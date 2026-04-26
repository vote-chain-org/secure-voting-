# Manually Adding a User

Normally, users register via the React frontend. If you need to manually add a voter directly to the underlying services without using the UI, follow these steps.

## Step 1: Enroll Fingerprint in ML Service
The Machine Learning service requires the raw image file to extract biometric features and map them to a `voter_id`.

1. Ensure the ML service is running (Port 5000).
2. Obtain a `.png` or `.bmp` fingerprint image for the user.
3. Run the following `curl` command to hit the `/enroll` endpoint:

```bash
curl -X POST http://localhost:5000/enroll \
  -F "voter_id=V004" \
  -F "fingerprint=@/path/to/fingerprint_image.png"
```
*Expected Response:* `{"status": "success", "voter_id": "V004"}`

## Step 2: Add User to PostgreSQL Database
The Spring Boot backend requires an entry in the `users` table to authenticate the voter and associate their Voter ID.

1. Open a terminal on the server.
2. Connect to the PostgreSQL database using the `postgres` user:
```bash
PGPASSWORD=postgres psql -U postgres -h localhost -d votechain
```
3. Insert the user record. **Note:** Passwords must be BCrypt hashed! You can generate a BCrypt hash online or use a known test hash (e.g., `$2a$10$gRUwd3ekYBnhh767oeN6uOL3defj2F883jIVQls0.75S.gEw3.piC` is `password123`).

```sql
INSERT INTO users (email, full_name, password, phone, role, voter_id) 
VALUES ('newuser@test.com', 'Alice User', '$2a$10$gRUwd3ekYBnhh767oeN6uOL3defj2F883jIVQls0.75S.gEw3.piC', '1234567890', 'VOTER', 'V004');
```

## Step 3: Register Voter on Blockchain
Hyperledger Fabric enforces that only registered voters can cast a vote.

1. Run the `fabric-cli` Docker container command to invoke the `registerVoter` chaincode function:
```bash
docker exec fabric-cli peer chaincode invoke \
    -o orderer.election.example.com:7050 \
    -C electionchannel -n voting \
    -c '{"function":"registerVoter","Args":["V004"]}' \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/election.example.com/orderers/orderer.election.example.com/msp/tlscacerts/tlsca.election.example.com-cert.pem \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
```

The user `V004` is now fully registered in all 3 required layers and can log in via the UI!
