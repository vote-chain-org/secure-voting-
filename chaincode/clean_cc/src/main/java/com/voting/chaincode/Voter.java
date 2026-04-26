package com.voting.chaincode;

import com.owlike.genson.annotation.JsonProperty;
import org.hyperledger.fabric.contract.annotation.DataType;
import org.hyperledger.fabric.contract.annotation.Property;

/**
 * Voter entity stored on-chain.
 *
 * DESIGN NOTE: This object contains ONLY the opaque voterID and a hasVoted flag.
 * No PII, no biometrics, no name — identity verification is entirely off-chain.
 * The external verification system issues the voterID at registration time;
 * the blockchain only cares whether that ID exists and whether it has voted.
 */
@DataType()
public final class Voter {

    @Property()
    @JsonProperty("voterID")
    private final String voterID;

    @Property()
    @JsonProperty("hasVoted")
    private final boolean hasVoted;

    public Voter(@JsonProperty("voterID") final String voterID,
                 @JsonProperty("hasVoted") final boolean hasVoted) {
        this.voterID = voterID;
        this.hasVoted = hasVoted;
    }

    public String getVoterID() {
        return voterID;
    }

    public boolean isHasVoted() {
        return hasVoted;
    }
}
