package com.votechain.backend.service;

import com.votechain.backend.model.User;
import com.votechain.backend.model.Vote;
import com.votechain.backend.repository.UserRepository;
import com.votechain.backend.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * VoteService — orchestrates the complete voting flow:
 *
 *   1. Send fingerprint to ML service → get voterId
 *   2. Validate voterId exists in PostgreSQL
 *   3. Check voter has not already voted in this election
 *   4. Submit vote to Hyperledger Fabric → get real txId
 *   5. Save vote record (with txId) to PostgreSQL
 *   6. Return result to caller
 *
 * CRITICAL: The voter identity (voterId) comes ONLY from ML fingerprint
 * verification. It must NEVER come from the frontend request.
 *
 * Safety net chain: ML → Backend DB → Chaincode
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VoteService {

    private final MlClientService mlClientService;
    private final FabricService fabricService;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;

    /**
     * Cast a vote using fingerprint-based identity verification.
     *
     * @param fingerprintBytes  raw fingerprint image bytes (from upload)
     * @param fingerprintName   original filename
     * @param candidateId       candidate being voted for (from frontend)
     * @param electionId        election identifier (from frontend)
     * @param electionTitle     display title (from frontend)
     * @param region            election region (from frontend)
     * @param status            election status (from frontend)
     * @param electionImg       election image URL (from frontend)
     * @return result map with status, txHash, voterId
     */
    public Map<String, Object> castVote(String rawBase64, int width, int height,
                                         String candidateId, String electionId,
                                         String electionTitle, String region,
                                         String status, String electionImg,
                                         String voterId) {

        java.io.File tmpPng = null;
        try {
            // Convert raw bytes → temp PNG on server
            tmpPng = com.votechain.backend.util.FingerprintImageUtil.rawToTempPng(rawBase64, width, height);

            // ── Gate 1: Identify voter by voterId from auth session ──
            // Since we removed 1:N, the voter must be logged in.
            // The voterId comes from the JWT/session, NOT from ML identification.

            // ── Gate 2+3: ML verification (liveness + minutiae + SDK score) ──
            Map<String, Object> mlResult = mlClientService.verifyWithId(voterId, tmpPng);

            boolean verified = Boolean.TRUE.equals(mlResult.get("verified"));
            if (!verified) {
                String reason = (String) mlResult.getOrDefault("reason", "verification_failed");
                log.warn("ML verification failed for voter={}: {}", voterId, reason);
                
                String friendlyReason = "Verification failed.";
                if ("liveness_failed".equals(reason)) friendlyReason = "Liveness check failed. Please ensure a real finger is placed on the scanner.";
                else if ("not_enrolled".equals(reason)) friendlyReason = "Fingerprint not found in the database. Please register first.";
                else if ("already_voted".equals(reason)) friendlyReason = "You have already voted in this election.";
                else if ("integrity_error".equals(reason)) friendlyReason = "Biometric template integrity check failed.";
                else if ("low_quality".equals(reason)) friendlyReason = "Fingerprint quality is too low. Please clean the scanner and try again.";
                else if ("no_match".equals(reason)) friendlyReason = "Fingerprint does not match the enrolled voter.";
                
                return Map.of("status", "failed", "reason", friendlyReason);
            }

            // ── Gate 4: SDK score threshold ──
            Number sdkScore = (Number) mlResult.get("sdk_score");
            if (sdkScore != null && sdkScore.intValue() < 165) {
                log.warn("SDK score too low for voter={}: {} (threshold=165)", voterId, sdkScore);
                return Map.of("status", "failed", "reason",
                    "Fingerprint verification confidence too low. Please try again.");
            }
            log.info("[VoteService] ML verified: liveness={}, match={}, sdk={}",
                mlResult.get("liveness_score"), mlResult.get("match_score"), sdkScore);

            // ── Gate 5: DB double-vote check ──
            if (voteRepository.existsByUser_VoterIdAndElectionId(voterId, electionId)) {
                return Map.of("status", "failed", "reason", "You have already voted in this election.");
            }

            // ── Gate 6: Blockchain submission ──
            String txId = fabricService.castVote(voterId, candidateId);

            // Save vote record
            User user = userRepository.findByVoterId(voterId).orElse(null);
            Vote vote = new Vote();
            vote.setUser(user);
            vote.setElectionId(electionId);
            vote.setElectionTitle(electionTitle);
            vote.setRegion(region);
            vote.setStatus(status);
            vote.setElectionImg(electionImg);
            vote.setCandidateId(candidateId);
            vote.setTxHash(txId);
            vote.setVotedAt(LocalDateTime.now());
            voteRepository.save(vote);

            log.info("Vote saved — voter={}, candidate={}, txId={}", voterId, candidateId, txId);

            return Map.of("status", "success", "txHash", txId, "voterId", voterId);

        } catch (Exception e) {
            log.error("Vote casting failed: {}", e.getMessage());
            return Map.of("status", "failed", "reason", e.getMessage());
        } finally {
            if (tmpPng != null) tmpPng.delete();
        }
    }
}
