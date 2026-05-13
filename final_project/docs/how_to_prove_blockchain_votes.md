# Proving Votes are in the Blockchain

A core promise of this system is that votes are immutable and stored on a decentralized ledger, not just a central database. Here is how you can prove that the votes exist on the blockchain, independent of the frontend or the Spring Boot backend.

## Method 1: The "Raw Query" (Deepest Level)
You can bypass the entire application stack and query the Hyperledger Fabric peer directly using the CLI container. This proves the data is sitting inside the blockchain's state database.

Run this command in your terminal:
```bash
docker exec fabric-cli peer chaincode query \
  -C electionchannel \
  -n voting \
  -c '{"function":"getResults","Args":[]}'
```

**What to look for:**
The output will be a raw JSON array of tallies. If you see numbers here, they are coming directly from the Hyperledger Fabric ledger.

---

## Method 2: Inspecting Peer Logs
Every time a vote is cast, the blockchain nodes (peers) must verify and commit the transaction. You can see this happening in real-time.

Run this command while someone is casting a vote:
```bash
docker logs -f peer0.org1.example.com
```

**What to look for:**
Look for lines containing `Committed block [...] with 1 transaction(s)`. This indicates that a new block has been added to the chain containing the vote.

---

## Method 3: The Admin Verification Link
In the Admin Dashboard, there is a technical comparison provided:

1. **Database Count:** Shows the number of vote records in PostgreSQL.
2. **Blockchain Count:** Shows the result of the `getResults` call to Hyperledger Fabric.

If these numbers match, it confirms that every vote recorded in the system has been successfully "anchored" into the blockchain.

---

## Method 4: Individual Voter Verification
You can verify if a specific voter's participation has been recorded without seeing who they voted for. This is essential for proving "Double Voting" prevention.

Run this command:
```bash
docker exec fabric-cli peer chaincode query \
  -C electionchannel \
  -n voting \
  -c '{"function":"hasVoted","Args":["V001"]}'
```
**Results:**
*   `true`: The blockchain confirms this person has already voted.
*   `false`: The person is registered but has not used their vote yet.

---

## What is actually stored on the Ledger?
The Hyperledger Fabric "World State" is divided into three main record types. You can think of these as the digital version of a physical polling station's logs:

1.  **Voter Registry (`VOTER_` prefix):**
    *   Stores: `VoterID` and `hasVoted` status.
    *   Purpose: Prevents someone from voting twice.
2.  **Candidate Registry (`CANDIDATE_` prefix):**
    *   Stores: `CandidateID` and `Name`.
    *   Purpose: The official "Ballot Paper" that cannot be altered once the election starts.
3.  **Vote Audit Trail (`VOTE_` prefix):**
    *   Stores: `VoterID`, `CandidateID`, and `Timestamp`.
    *   Purpose: The immutable receipt of every vote. If the central database is hacked or deleted, these records are used to re-calculate the final results.

---

## Method 5: Viewing the Admin Transaction Log
To see a technical log of every transaction that occurred today (including timestamps and transaction keys), run:

```bash
docker exec fabric-cli peer chaincode query \
  -C electionchannel \
  -n voting \
  -c '{"function":"getTodayTransactionLog","Args":[]}'
```

---

## Method 6: Database vs. Blockchain Discrepancy (The "Cheat Test")
To prove the blockchain is the "Source of Truth," you could theoretically delete a vote from the PostgreSQL database:
1. Delete a row from the `votes` table in Postgres using `manage_users.sh` or SQL.
2. Refresh the Admin Dashboard.
3. **Observation:** You will notice the "Database Count" goes down, but the "Blockchain Count" (the one used for final results) **remains the same**. 

This proves that even if someone hacks the database, they cannot change the official election results stored on the blockchain.
