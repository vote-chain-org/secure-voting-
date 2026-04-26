package com.votechain.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * MlClientService — forwards fingerprint images to the ML service for identity verification.
 *
 * Flow:
 *   1. Receive fingerprint PNG bytes from the controller
 *   2. POST multipart/form-data to ML service: POST /verify
 *   3. ML compares against enrolled fingerprints
 *   4. Return matched voterId (or null if no match)
 *
 * The voterId returned by this service is the SOLE source of voter identity.
 * It must NEVER come from the frontend.
 */
@Slf4j
@Service
public class MlClientService {

    private final WebClient webClient;

    public MlClientService(@Value("${ml.service.url:http://localhost:5000}") String mlUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(mlUrl)
                .build();
    }

    /**
     * Enroll a voter's fingerprint in the ML service.
     */
    public void enroll(String voterId, java.io.File pngFile) throws java.io.IOException {
        log.info("Sending fingerprint to ML service for enrollment: voterId={}", voterId);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("voter_id", voterId);
        builder.part("fingerprint", new org.springframework.core.io.FileSystemResource(pngFile))
               .contentType(MediaType.IMAGE_PNG);

        try {
            webClient.post()
                    .uri("/enroll")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            log.info("[MlClient] Enrolled voter {} in ML service", voterId);
        } catch (Exception e) {
            log.error("ML service enrollment failed: {}", e.getMessage());
            throw new RuntimeException("ML enrollment failed: " + e.getMessage());
        }
    }

    /**
     * Verify a voter's fingerprint (1:1) — liveness + minutiae + SDK score.
     * Returns full result map including sdk_score.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> verifyWithId(String voterId, java.io.File pngFile) throws java.io.IOException {
        log.info("Sending fingerprint to ML service for verification: voterId={}", voterId);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("voter_id", voterId);
        builder.part("fingerprint", new org.springframework.core.io.FileSystemResource(pngFile))
               .contentType(MediaType.IMAGE_PNG);

        try {
            return webClient.post()
                    .uri("/verify")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("ML service verification failed: {}", e.getMessage());
            throw new RuntimeException("Fingerprint verification service unavailable: " + e.getMessage());
        }
    }
}
