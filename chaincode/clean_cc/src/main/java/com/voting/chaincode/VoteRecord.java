package com.voting.chaincode;

import com.owlike.genson.annotation.JsonProperty;
import org.hyperledger.fabric.contract.annotation.DataType;
import org.hyperledger.fabric.contract.annotation.Property;

/**
 * VoteRecord — one entry per vote cast, stored under a composite key.
 *
 * KEY FORMAT: VOTE_<candidateID>_<txID>
 *
 * WHY COMPOSITE KEYS FOR VOTES?
 * ─────────────────────────────
 * Hyperledger Fabric uses MVCC (Multi-Version Concurrency Control).
 * If three booths each read and then write the SAME key (e.g., a shared
 * voteCount on the Candidate object) in the same block, Fabric will detect
 * a read-write conflict and reject 2 of the 3 transactions.
 *
 * By writing each vote to a UNIQUE composite key (guaranteed unique because
 * the txID component comes from the transaction itself), all three booths
 * can write simultaneously without ever touching the same key. Zero conflicts.
 *
 * getResults() uses GetStateByPartialCompositeKey("VOTE", [candidateID]) to
 * iterate and count all records for a given candidate — a safe read-only scan.
 */
@DataType()
public final class VoteRecord {

    @Property()
    @JsonProperty("voterID")
    private final String voterID;

    @Property()
    @JsonProperty("candidateID")
    private final String candidateID;

    @Property()
    @JsonProperty("txTimestamp")
    private final String txTimestamp;

    public VoteRecord(@JsonProperty("voterID") final String voterID,
                      @JsonProperty("candidateID") final String candidateID,
                      @JsonProperty("txTimestamp") final String txTimestamp) {
        this.voterID = voterID;
        this.candidateID = candidateID;
        this.txTimestamp = txTimestamp;
    }

    public String getVoterID() {
        return voterID;
    }

    public String getCandidateID() {
        return candidateID;
    }

    public String getTxTimestamp() {
        return txTimestamp;
    }
}
