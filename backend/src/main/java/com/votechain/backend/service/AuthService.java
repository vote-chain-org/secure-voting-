package com.votechain.backend.service;

import com.votechain.backend.dto.AuthResponse;
import com.votechain.backend.dto.LoginRequest;
import com.votechain.backend.dto.RegisterRequest;
import com.votechain.backend.model.User;
import com.votechain.backend.repository.UserRepository;
import com.votechain.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final FabricService fabricService;
    private final MlClientService mlClientService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setVoterId(request.getVoterId());
        user.setPhone(request.getPhone());
        user.setRole("VOTER");

        if (request.getFingerprintRawB64() != null) {
            user.setFingerprintRawB64(request.getFingerprintRawB64());
            user.setFpWidth(request.getFpWidth());
            user.setFpHeight(request.getFpHeight());
        }

        userRepository.save(user);
        log.info("User registered in DB: email={}, voterId={}", request.getEmail(), request.getVoterId());

        if (request.getFingerprintRawB64() != null) {
            java.io.File tmpPng = null;
            try {
                tmpPng = com.votechain.backend.util.FingerprintImageUtil.rawToTempPng(
                        request.getFingerprintRawB64(),
                        request.getFpWidth(),
                        request.getFpHeight()
                );
                mlClientService.enroll(user.getVoterId(), tmpPng);
            } catch (Exception e) {
                log.warn("Fingerprint enrollment failed for {}: {}", user.getVoterId(), e.getMessage());
                // Don't throw — account is created, enrollment is recoverable
            } finally {
                if (tmpPng != null) tmpPng.delete();
            }
        }

        // Auto-register voter on Fabric blockchain.
        // Non-fatal: if voter already exists on chain (re-registration attempt),
        // or if Fabric is temporarily unavailable, we log and continue.
        // The voter can still be manually registered via docker exec later.
        if (request.getVoterId() != null && !request.getVoterId().isBlank()) {
            try {
                fabricService.registerVoter(request.getVoterId());
                log.info("Voter registered on blockchain: voterId={}", request.getVoterId());
            } catch (Exception e) {
                log.warn("Blockchain voter registration failed for voterId={}: {}",
                        request.getVoterId(), e.getMessage());
                // Do NOT throw — user is already saved to DB.
                // They can vote once blockchain registration is retried manually.
            }
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getFullName(), user.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getFullName(), user.getRole());
    }
}
