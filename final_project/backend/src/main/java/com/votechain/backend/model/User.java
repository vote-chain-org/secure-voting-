package com.votechain.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String voterId;

    private String phone;

    @Column(nullable = false)
    private String role = "VOTER";

    @Column(columnDefinition = "TEXT")
    private String profilePhoto;

    @Column(columnDefinition = "TEXT")
    private String fingerprintRawB64;

    @Column
    private Integer fpWidth;

    @Column
    private Integer fpHeight;
}