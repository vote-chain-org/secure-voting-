package com.votechain.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "votes")
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Who voted
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String electionId;

    @Column(nullable = false)
    private String electionTitle;

    @Column(nullable = false)
    private String region;

    @Column(nullable = false)
    private String status; // "Live" | "Completed" | "Upcoming"

    // Blockchain tx hash — set after vote recorded on-chain
    @Column(columnDefinition = "TEXT")
    private String txHash;

    // Candidate voted for — stored in DB for record-keeping
    // Never exposed to users via API (secret ballot)
    private String candidateId;

    @Column(nullable = false)
    private LocalDateTime votedAt;

    // Election image URL for display
    private String electionImg;
}