package com.votechain.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VoteResponse {
    private Long id;
    private String electionId;
    private String electionTitle;
    private String region;
    private String status;
    private String txHash;
    private LocalDateTime votedAt;
    private String electionImg;
    // NOTE: candidateVoted is intentionally NOT included — secret ballot
}