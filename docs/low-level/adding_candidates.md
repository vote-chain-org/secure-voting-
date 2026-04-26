# Manually Adding Candidates

In the VoteChain system, candidates are stored **exclusively on the blockchain ledger**. There is no "candidates" table in the PostgreSQL database. This ensures that the ballot itself is immutable and cannot be tampered with by a database administrator.

To add a new candidate to an election, you must submit a transaction to the Hyperledger Fabric network.

## Method: Using the Fabric CLI
The most direct way to add a candidate is to use the `fabric-cli` container.

### Step 1: Prepare the Command
You need three pieces of information:
1.  **Candidate ID:** A unique string (e.g., `5`).
2.  **Candidate Name:** The full name of the candidate (e.g., `John Smith`).

### Step 2: Execute the Transaction
Run the following command in your terminal:

```bash
docker exec fabric-cli peer chaincode invoke \
    -o orderer.election.example.com:7050 \
    -C electionchannel -n voting \
    -c '{"function":"registerCandidate","Args":["5","John Smith"]}' \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/election.example.com/orderers/orderer.election.example.com/tls/ca.crt \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
```

---

## Technical Details
When you run this command:
1.  **Identity Check:** The `fabric-cli` uses the `Admin@org1.example.com` certificate to sign the request.
2.  **Registry Check:** The Smart Contract checks if a candidate with ID `5` already exists. If it does, the transaction is rejected.
3.  **Persistence:** Once committed, the candidate is added to the ledger state. They will immediately appear in the **Admin Dashboard** and on the **Voter Ballot** page without requiring any backend or database updates.

## Verification
To verify the candidate was added successfully, you can query the blockchain's candidate list:

```bash
docker exec fabric-cli peer chaincode query \
    -C electionchannel -n voting \
    -c '{"function":"getResults","Args":[]}'
```
You should see your new candidate in the JSON output with a `voteCount` of `0`.
