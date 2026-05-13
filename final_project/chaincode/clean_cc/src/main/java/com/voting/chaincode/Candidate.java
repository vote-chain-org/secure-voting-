package com.voting.chaincode;

import com.owlike.genson.annotation.JsonProperty;
import org.hyperledger.fabric.contract.annotation.DataType;
import org.hyperledger.fabric.contract.annotation.Property;

/**
 * Candidate entity stored on-chain.
 *
 * DESIGN NOTE: voteCount is NOT stored here and NOT incremented here.
 * Storing a shared counter causes MVCC phantom-read conflicts when multiple
 * booths submit votes concurrently — Fabric's MVCC will reject any transaction
 * that tries to update a key that was already updated in the same block.
 *
 * Instead, each individual vote is stored as a separate VoteRecord with a
 * composite key VOTE_<candidateID>_<txID>. getResults() then uses
 * GetStateByPartialCompositeKey to count all entries for each candidate.
 * This completely eliminates write conflicts.
 */
@DataType()
public final class Candidate {

    @Property()
    @JsonProperty("candidateID")
    private final String candidateID;

    @Property()
    @JsonProperty("name")
    private final String name;

    public Candidate(@JsonProperty("candidateID") final String candidateID,
                     @JsonProperty("name") final String name) {
        this.candidateID = candidateID;
        this.name = name;
    }

    public String getCandidateID() {
        return candidateID;
    }

    public String getName() {
        return name;
    }
}
