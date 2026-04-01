
package com.votechain.backend.model;

import jakarta.persistence.*;
import lombok.Data;


@Data
@Entity
@Table(name="user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable=false , unique = true)
    private String voterId;

    private String phone;

    @Column(nullable = false)
    private String role = "VOTER";

}
