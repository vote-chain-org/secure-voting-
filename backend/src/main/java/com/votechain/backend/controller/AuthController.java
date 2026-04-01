package com.votechain.backend.controller;

import com.votechain.backend.dto.AuthResponse;
import com.votechain.backend.dto.LoginRequest;
import com.votechain.backend.dto.RegisterRequest;
import com.votechain.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
    @GetMapping("/test")
    public String test() {
        return "API working";
    }
    @GetMapping("/api/user/profile")
    public String profile() {
        return "Protected data";
    }
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<java.util.Map<String, String>> handleError(RuntimeException ex) {
        return ResponseEntity
                .badRequest()
                .body(java.util.Map.of("message", ex.getMessage()));
    }
}