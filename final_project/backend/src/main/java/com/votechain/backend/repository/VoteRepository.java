package com.votechain.backend.repository;

import com.votechain.backend.model.Vote;
import com.votechain.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    List<Vote> findByUserOrderByVotedAtDesc(User user);
    boolean existsByUser_VoterIdAndElectionId(String voterId, String electionId);
}