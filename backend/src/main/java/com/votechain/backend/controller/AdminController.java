package com.votechain.backend.controller;

import com.votechain.backend.model.User;
import com.votechain.backend.repository.UserRepository;
import com.votechain.backend.service.FabricService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Admin-only endpoints for viewing election results.
 *
 * GET /api/admin/results      — fetches vote tallies from blockchain via Fabric Gateway
 *
 * Protected by ADMIN role check in SecurityConfig.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final FabricService fabricService;
    private final UserRepository userRepository;

    /**
     * GET /api/admin/results
     * Queries blockchain vote tallies directly via Fabric Gateway.
     */
    @GetMapping("/results")
    public ResponseEntity<String> getResults(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body("{\"error\": \"Admin access required\"}");
        }

        try {
            String results = fabricService.getResults();
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("Failed to fetch blockchain results: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
