package com.votechain.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for vote casting metadata.
 *
 * NOTE: voterId is NOT included — voter identity comes ONLY from
 * ML fingerprint verification, never from the frontend.
 * NOTE: boothId is NOT included — no booth routing in simplified architecture.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class VoteCastRequest {
    private String candidateId;
    private String electionId;
    private String electionTitle;
    private String region;
    private String status;
    private String electionImg;
}
