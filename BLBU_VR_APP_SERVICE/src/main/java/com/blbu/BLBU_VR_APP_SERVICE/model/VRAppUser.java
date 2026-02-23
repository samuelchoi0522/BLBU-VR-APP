package com.blbu.BLBU_VR_APP_SERVICE.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "vr_app_users")
public class VRAppUser {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    @Builder.Default
    private Boolean active = true; // Default to true for new users

    @Column(name = "current_day", nullable = false, columnDefinition = "INTEGER DEFAULT 1")
    @Builder.Default
    private Integer currentDay = 1; // User's current day in the program (starts at 1)

    // Transient field - not persisted to vr_app_users table, used only for registration
    @Transient
    private String password;
}
