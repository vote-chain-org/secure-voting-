# Viewing Raw Blockchain Data

This guide explains how to see the "World State" of the blockchain—the actual JSON documents for Voters and Candidates stored on the ledger.

Since this system uses **CouchDB** as the state database, you have two ways to look at the data:

---

## Method 1: The Visual Browser Interface (Fauxton)
The easiest way to see everything is through the CouchDB web interface.

1.  **Open your browser** and go to: `http://localhost:5984/_utils/`
2.  **Login:**
    *   **Username:** `admin`
    *   **Password:** `adminpw`
3.  **Find the Database:** Look for the database named **`electionchannel_voting`**.
4.  **Explore:** Click on the database name. You will see a list of documents.
    *   Documents starting with `CANDIDATE_` are your candidates.
    *   Documents starting with `VOTER_` are your registered voters.
    *   Documents starting with `VOTE_` are the audit receipts.

---

## Method 2: Querying via Terminal (cURL)
You can pull the raw data directly from the CouchDB API using these commands:

### A. List All Candidates
```bash
curl -u admin:adminpw -X POST http://localhost:5984/electionchannel_voting/_find \
  -H "Content-Type: application/json" \
  -d '{"selector": {"_id": {"$regex": "^CANDIDATE_"}}}' | jq
```

### B. List All Registered Voters
```bash
curl -u admin:adminpw -X POST http://localhost:5984/electionchannel_voting/_find \
  -H "Content-Type: application/json" \
  -d '{"selector": {"_id": {"$regex": "^VOTER_"}}}' | jq
```

### C. Audit: Who did a specific Voter vote for? (The Audit Trail)
Since the blockchain stores a `VoteRecord` for every transaction, you can link a Voter ID to their chosen Candidate for auditing purposes.

```bash
curl -u admin:adminpw -X POST http://localhost:5984/electionchannel_voting/_find \
  -H "Content-Type: application/json" \
  -d '{"selector": {"voterID": "V001"}}' | jq
```
**What this shows:**
The output will return the `VoteRecord` JSON containing both the `voterID` and the `candidateID`, along with the official blockchain `txTimestamp`.

---

## Method 3: Using the Fabric CLI (Secure Query)
If you want to use the official blockchain tools to pull a specific record:

### To see a specific Candidate:
```bash
docker exec fabric-cli peer chaincode query \
  -C electionchannel \
  -n voting \
  -c '{"function":"getCandidate","Args":["1"]}'
```

### To see a specific Voter:
```bash
docker exec fabric-cli peer chaincode query \
  -C electionchannel \
  -n voting \
  -c '{"function":"getVoter","Args":["V001"]}'
```

---

## Technical Note: Why is this different from PostgreSQL?
*   The data you see here is the **authoritative truth**.
*   If a document exists here, it has been verified by the blockchain network.
*   The `_rev` field in CouchDB documents helps the blockchain track versions and prevent double-spending/double-voting at the database level.
