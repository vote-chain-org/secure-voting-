# Manual Processes Index

This document serves as an index for various low-level administrative and maintenance tasks you can perform manually on the VoteChain system.

## Available Guides

- **[Manually Adding a User](add_user_manual.md)**
  Instructions on inserting a user into the PostgreSQL DB, registering them on the Blockchain, and bypassing the UI to enroll their fingerprint in the ML service.
  
- **[Manually Removing a User](remove_user_manual.md)**
  Instructions on deleting a user's PostgreSQL record and wiping their fingerprint image from the ML service storage.

## Other Common Manual Tasks

### 1. Registering a New Candidate on the Blockchain
If you added a new election with new candidate IDs in the frontend UI, you MUST register those candidates on the Fabric ledger before anyone can vote for them.

```bash
docker exec fabric-cli peer chaincode invoke \
    -o orderer.election.example.com:7050 \
    -C electionchannel -n voting \
    -c '{"function":"registerCandidate","Args":["5","New Candidate Name"]}' \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/election.example.com/orderers/orderer.election.example.com/msp/tlscacerts/tlsca.election.example.com-cert.pem \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
```

### 2. Viewing Service Logs
If you are running the system via `./run_server_v2.sh`, the background processes output their logs to the `logs/` directory.
- `tail -f logs/ml.log`
- `tail -f logs/backend.log`
- `tail -f logs/frontend.log`

*(Note: If using `tmux_votechain.sh`, the logs are printed directly to the terminal panes).*

### 3. Querying the Ledger Directly
To manually verify the exact state of votes or candidates without relying on the Spring Boot backend:

```bash
# Get all results
docker exec fabric-cli peer chaincode query -C electionchannel -n voting -c '{"function":"getResults","Args":[]}'
```
