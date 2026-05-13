package com.votechain.backend.dto;

import lombok.Data;
//@Data automatically adds all the getters and setter functions
@Data
public class LoginRequest {
    private String email;
    private String password;

}
