package com.votechain.backend.controller;

import com.votechain.backend.dto.VoteResponse;
import com.votechain.backend.model.User;
import com.votechain.backend.model.Vote;
import com.votechain.backend.repository.UserRepository;
import com.votechain.backend.repository.VoteRepository;
import com.votechain.backend.service.VoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteRepository voteRepository;
    private final UserRepository userRepository;
    private final VoteService voteService;

    // ── POST /api/votes/cast ───────────────────────────────────
    // Accepts fingerprint data as base64 string + metadata
    @PostMapping("/cast")
    public ResponseEntity<Map<String, Object>> castVote(
            @RequestParam("fingerprintRawB64") String fingerprintRawB64,
            @RequestParam("fpWidth") int fpWidth,
            @RequestParam("fpHeight") int fpHeight,
            @RequestParam("candidateId") String candidateId,
            @RequestParam("electionId") String electionId,
            @RequestParam(value = "electionTitle", defaultValue = "") String electionTitle,
            @RequestParam(value = "region", defaultValue = "") String region,
            @RequestParam(value = "status", defaultValue = "Live") String status,
            @RequestParam(value = "electionImg", defaultValue = "") String electionImg,
            Authentication authentication) {

        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> result = voteService.castVote(
                    fingerprintRawB64, fpWidth, fpHeight,
                    candidateId, electionId,
                    electionTitle, region, status, electionImg,
                    user.getVoterId()
            );

            if ("success".equals(result.get("status"))) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("status", "failed", "reason", e.getMessage())
            );
        }
    }

    // ── GET /api/votes/my ──────────────────────────────────────
    // Returns all vote receipts for the logged-in user
    // Candidate voted is NEVER included — secret ballot
    @GetMapping("/my")
    public ResponseEntity<List<VoteResponse>> getMyVotes(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<VoteResponse> votes = voteRepository
                .findByUserOrderByVotedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(votes);
    }

    // ── Helper ─────────────────────────────────────────────────
    private VoteResponse toResponse(Vote vote) {
        return new VoteResponse(
                vote.getId(),
                vote.getElectionId(),
                vote.getElectionTitle(),
                vote.getRegion(),
                vote.getStatus(),
                vote.getTxHash(),
                vote.getVotedAt(),
                vote.getElectionImg());
    }
}