package com.voting.chaincode;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hyperledger.fabric.contract.Context;
import org.hyperledger.fabric.contract.ContractInterface;
import org.hyperledger.fabric.contract.annotation.Contract;
import org.hyperledger.fabric.contract.annotation.Default;
import org.hyperledger.fabric.contract.annotation.Info;
import org.hyperledger.fabric.contract.annotation.Transaction;
import org.hyperledger.fabric.shim.ChaincodeException;
import org.hyperledger.fabric.shim.ChaincodeStub;
import org.hyperledger.fabric.shim.ledger.CompositeKey;
import org.hyperledger.fabric.shim.ledger.KeyValue;
import org.hyperledger.fabric.shim.ledger.QueryResultsIterator;

import com.owlike.genson.Genson;

/**
 * VotingContract — Hyperledger Fabric chaincode for a verified voter-ID voting system.
 *
 * ARCHITECTURE: TWO-LAYER SECURITY
 * ──────────────────────────────────
 * Layer 1 (off-chain): External identity verification system authenticates the voter
 *   (biometric, national ID, etc.) and issues a verified voterID. The blockchain has
 *   ZERO knowledge of the authentication mechanism. No biometric data ever touches
 *   the ledger.
 *
 * Layer 2 (on-chain / this file): This chaincode ONLY enforces structural rules:
 *   - Does the voterID exist in the registry?
 *   - Has that voter already voted?
 *   - Does the candidateID exist?
 *   It does NOT re-verify identity. That responsibility lies entirely with the
 *   external system and the booth application layer.
 *
 * ADMIN ROLE:
 *   Admin is enforced at the chaincode level by checking the MSP ID of the caller.
 *   Admin can only call read functions: getResults() and getTodayTransactionLog().
 *   Attempting to call write functions as Admin will be rejected here.
 *
 * KEY NAMESPACES:
 *   VOTER_<voterID>       → Voter JSON
 *   CANDIDATE_<candID>    → Candidate JSON
 *   VOTE_<candID>_<txID>  → VoteRecord JSON (composite key, one per vote)
 */
@Contract(
    name = "VotingContract",
    info = @Info(
        title = "Verified Voter-ID Voting Contract",
        description = "Blockchain layer of a two-layer election system. Identity verification is external.",
        version = "1.0.0"
    )
)
@Default
public final class VotingContract implements ContractInterface {

    // ── Key prefixes ────────────────────────────────────────────────────────────
    private static final String VOTER_PREFIX     = "VOTER";
    private static final String CANDIDATE_PREFIX = "CANDIDATE";
    private static final String VOTE_PREFIX      = "VOTE";

    // ── Admin MSP ID — must match the MSP ID defined in configtx.yaml ───────────
    private static final String ADMIN_MSP_ID = "AdminMSP";

    private final Genson genson = new Genson();

    // ═══════════════════════════════════════════════════════════════════════════
    // INPUT VALIDATION HELPER
    // ═══════════════════════════════════════════════════════════════════════════

    private void validateArgs(String[] args, String[] names) {
        if (args.length != names.length) {
            throw new ChaincodeException(
                "Expected " + names.length + " argument(s), got " + args.length,
                "INVALID_ARGUMENT_COUNT"
            );
        }
        for (int i = 0; i < args.length; i++) {
            if (args[i] == null || args[i].isBlank()) {
                throw new ChaincodeException(
                    "Argument '" + names[i] + "' must not be null or empty",
                    "INVALID_ARGUMENT"
                );
            }
            if (args[i].contains("\u0000")) {
                throw new ChaincodeException(
                    "Argument '" + names[i] + "' contains illegal character (null byte)",
                    "INVALID_ARGUMENT_FORMAT"
                );
            }
            if (args[i].length() > 256) {
                throw new ChaincodeException(
                    "Argument '" + names[i] + "' exceeds maximum length of 256 characters",
                    "INVALID_ARGUMENT_LENGTH"
                );
            }
        }
    }

    private void requireNotAdmin(Context ctx) {
        String mspID = ctx.getClientIdentity().getMSPID();
        if (ADMIN_MSP_ID.equals(mspID)) {
            throw new ChaincodeException(
                "Admin identity is read-only and cannot invoke write functions",
                "UNAUTHORIZED"
            );
        }
    }

    private void requireAdmin(Context ctx) {
        String mspID = ctx.getClientIdentity().getMSPID();
        if (!ADMIN_MSP_ID.equals(mspID)) {
            throw new ChaincodeException(
                "Only Admin identity may call this function",
                "UNAUTHORIZED"
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WRITE FUNCTIONS (Booth-only, blocked for Admin)
    // ═══════════════════════════════════════════════════════════════════════════

    @Transaction()
    public void registerVoter(final Context ctx, final String voterID) {
        validateArgs(new String[]{voterID}, new String[]{"voterID"});
        requireNotAdmin(ctx);

        ChaincodeStub stub = ctx.getStub();
        String key = VOTER_PREFIX + "_" + voterID;

        String existing = stub.getStringState(key);
        if (existing != null && !existing.isEmpty()) {
            throw new ChaincodeException(
                "Voter '" + voterID + "' is already registered",
                "VOTER_ALREADY_EXISTS"
            );
        }

        Voter voter = new Voter(voterID, false);
        stub.putStringState(key, genson.serialize(voter));
    }

    @Transaction()
    public void registerCandidate(final Context ctx,
                                   final String candidateID,
                                   final String name) {
        validateArgs(new String[]{candidateID, name}, new String[]{"candidateID", "name"});
        requireNotAdmin(ctx);

        ChaincodeStub stub = ctx.getStub();
        String key = CANDIDATE_PREFIX + "_" + candidateID;

        String existing = stub.getStringState(key);
        if (existing != null && !existing.isEmpty()) {
            throw new ChaincodeException(
                "Candidate '" + candidateID + "' is already registered",
                "CANDIDATE_ALREADY_EXISTS"
            );
        }

        Candidate candidate = new Candidate(candidateID, name);
        stub.putStringState(key, genson.serialize(candidate));
    }

    @Transaction()
    public void castVerifiedVote(final Context ctx,
                                  final String voterID,
                                  final String candidateID) {
        validateArgs(new String[]{voterID, candidateID}, new String[]{"voterID", "candidateID"});
        requireNotAdmin(ctx);

        ChaincodeStub stub = ctx.getStub();

        // 1. Voter must exist
        String voterKey = VOTER_PREFIX + "_" + voterID;
        String voterJSON = stub.getStringState(voterKey);
        if (voterJSON == null || voterJSON.isEmpty()) {
            throw new ChaincodeException(
                "Voter '" + voterID + "' is not registered",
                "VOTER_NOT_FOUND"
            );
        }

        // 2. Voter must not have voted already
        Voter voter = genson.deserialize(voterJSON, Voter.class);
        if (voter.isHasVoted()) {
            throw new ChaincodeException(
                "Voter '" + voterID + "' has already cast a vote",
                "VOTER_ALREADY_VOTED"
            );
        }

        // 3. Candidate must exist
        String candidateKey = CANDIDATE_PREFIX + "_" + candidateID;
        String candidateJSON = stub.getStringState(candidateKey);
        if (candidateJSON == null || candidateJSON.isEmpty()) {
            throw new ChaincodeException(
                "Candidate '" + candidateID + "' is not registered",
                "CANDIDATE_NOT_FOUND"
            );
        }

        // 4. Record the vote with a unique composite key
        String txID = stub.getTxId();
        String txTimestamp = stub.getTxTimestamp().toString();

        CompositeKey voteKey = stub.createCompositeKey(
            VOTE_PREFIX, new String[]{candidateID, txID}
        );
        VoteRecord record = new VoteRecord(voterID, candidateID, txTimestamp);
        stub.putStringState(voteKey.toString(), genson.serialize(record));

        // 5. Mark voter as having voted
        Voter updatedVoter = new Voter(voterID, true);
        stub.putStringState(voterKey, genson.serialize(updatedVoter));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // READ FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    @Transaction(intent = Transaction.TYPE.EVALUATE)
    public String hasVoted(final Context ctx, final String voterID) {
        validateArgs(new String[]{voterID}, new String[]{"voterID"});

        ChaincodeStub stub = ctx.getStub();
        String key = VOTER_PREFIX + "_" + voterID;
        String voterJSON = stub.getStringState(key);

        if (voterJSON == null || voterJSON.isEmpty()) {
            throw new ChaincodeException(
                "Voter '" + voterID + "' is not registered",
                "VOTER_NOT_FOUND"
            );
        }

        Voter voter = genson.deserialize(voterJSON, Voter.class);
        return String.valueOf(voter.isHasVoted());
    }

    @Transaction(intent = Transaction.TYPE.EVALUATE)
    public String getResults(final Context ctx) {
        ChaincodeStub stub = ctx.getStub();
        List<String> results = new ArrayList<>();

        String startKey = CANDIDATE_PREFIX + "_\u0000";
        String endKey   = CANDIDATE_PREFIX + "_\uFFFF";

        try (QueryResultsIterator<KeyValue> candidates =
                 stub.getStateByRange(startKey, endKey)) {

            for (KeyValue kv : candidates) {
                Candidate c = genson.deserialize(kv.getStringValue(), Candidate.class);

                long count = 0;
                try (QueryResultsIterator<KeyValue> votes =
                         stub.getStateByPartialCompositeKey(
                             VOTE_PREFIX, new String[]{c.getCandidateID()})) {
                    for (KeyValue ignored : votes) {
                        count++;
                    }
                } catch (Exception e) {
                    throw new ChaincodeException(
                        "Error counting votes for candidate " + c.getCandidateID(),
                        "QUERY_ERROR"
                    );
                }

                results.add(String.format(
                    "{\"candidateID\":\"%s\",\"name\":\"%s\",\"voteCount\":%d}",
                    c.getCandidateID(), c.getName(), count
                ));
            }
        } catch (ChaincodeException ce) {
            throw ce;
        } catch (Exception e) {
            throw new ChaincodeException(
                "Error scanning candidate registry: " + e.getMessage(),
                "QUERY_ERROR"
            );
        }

        return "[" + String.join(",", results) + "]";
    }

    @Transaction(intent = Transaction.TYPE.EVALUATE)
    public String getTodayTransactionLog(final Context ctx) {
        requireAdmin(ctx);

        ChaincodeStub stub = ctx.getStub();
        String today = Instant.now().toString().substring(0, 10);

        List<String> log = new ArrayList<>();
        String startKey = CANDIDATE_PREFIX + "_\u0000";
        String endKey   = CANDIDATE_PREFIX + "_\uFFFF";

        try (QueryResultsIterator<KeyValue> candidates =
                 stub.getStateByRange(startKey, endKey)) {
            for (KeyValue kv : candidates) {
                Candidate c = genson.deserialize(kv.getStringValue(), Candidate.class);
                try (QueryResultsIterator<KeyValue> votes =
                         stub.getStateByPartialCompositeKey(
                             VOTE_PREFIX, new String[]{c.getCandidateID()})) {
                    for (KeyValue v : votes) {
                        VoteRecord vr = genson.deserialize(v.getStringValue(), VoteRecord.class);
                        if (vr.getTxTimestamp().startsWith(today)) {
                            log.add(String.format(
                                "{\"key\":\"%s\",\"timestamp\":\"%s\"}",
                                v.getKey(), vr.getTxTimestamp()
                            ));
                        }
                    }
                }
            }
        } catch (Exception e) {
            throw new ChaincodeException(
                "Error reading transaction log: " + e.getMessage(),
                "QUERY_ERROR"
            );
        }

        return "[" + String.join(",", log) + "]";
    }
}