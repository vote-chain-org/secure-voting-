package com.votechain.backend.controller;

import com.votechain.backend.dto.VoteResponse;
import com.votechain.backend.model.User;
import com.votechain.backend.model.Vote;
import com.votechain.backend.repository.UserRepository;
import com.votechain.backend.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteRepository voteRepository;
    private final UserRepository userRepository;

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