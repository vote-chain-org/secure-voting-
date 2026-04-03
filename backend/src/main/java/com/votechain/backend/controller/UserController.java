package com.votechain.backend.controller;

import com.votechain.backend.dto.UpdateProfileRequest;
import com.votechain.backend.dto.UserProfileResponse;
import com.votechain.backend.model.User;
import com.votechain.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    // ── GET /api/user/profile ──────────────────────────────────
    // Returns the logged-in user's profile data
    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(Authentication authentication) {
        User user = getAuthUser(authentication);
        return ResponseEntity.ok(toResponse(user));
    }

    // ── PUT /api/user/profile ──────────────────────────────────
    // Updates fullName and phone only (email + voterId are immutable)
    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestBody UpdateProfileRequest request,
            Authentication authentication) {

        User user = getAuthUser(authentication);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        userRepository.save(user);
        return ResponseEntity.ok(toResponse(user));
    }

    // ── POST /api/user/profile/photo ───────────────────────────
    // Accepts base64 encoded image string and stores in Postgres TEXT column
    @PostMapping("/profile/photo")
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String base64 = body.get("photo");
        if (base64 == null || base64.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No photo provided"));
        }

        // Basic size guard — base64 of 2MB image ≈ 2.7MB string
        if (base64.length() > 3_000_000) {
            return ResponseEntity.badRequest().body(Map.of("message", "Photo too large. Max 2MB."));
        }

        User user = getAuthUser(authentication);
        user.setProfilePhoto(base64);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Photo updated successfully"));
    }

    // ── Helper ─────────────────────────────────────────────────
    private User getAuthUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserProfileResponse toResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getVoterId(),
                user.getRole(),
                user.getProfilePhoto());
    }
}