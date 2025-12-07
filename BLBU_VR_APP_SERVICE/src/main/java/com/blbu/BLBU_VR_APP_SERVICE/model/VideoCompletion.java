package com.blbu.BLBU_VR_APP_SERVICE.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import java.util.UUID;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "video_completion")
public class VideoCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private VideoMetadata video;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;
}
