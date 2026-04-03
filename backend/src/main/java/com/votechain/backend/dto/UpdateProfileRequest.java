package com.votechain.backend.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    // email and voterId intentionally excluded — not editable after registration
}