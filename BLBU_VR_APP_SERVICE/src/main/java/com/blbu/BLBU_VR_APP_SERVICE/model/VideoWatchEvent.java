package com.blbu.BLBU_VR_APP_SERVICE.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "video_watch_events")
public class VideoWatchEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id")
    private VideoMetadata video;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EventType eventType;

    // Current time in video when event occurred (in seconds)
    private Double videoTime;

    // Total duration of the video (in seconds)
    private Double videoDuration;

    // Percentage watched so far
    private Double percentWatched;

    // Additional details (e.g., "attempted to skip from 10s to 50s")
    @Column(length = 500)
    private String details;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // IP address for additional verification
    private String ipAddress;

    // User agent for device detection
    @Column(length = 500)
    private String userAgent;

    public enum EventType {
        SESSION_START,      // User started watching
        PLAY,               // Video started playing
        PAUSE,              // Video paused
        SEEK_ATTEMPT,       // User tried to skip (blocked)
        TAB_HIDDEN,         // User switched tabs
        TAB_VISIBLE,        // User returned to tab
        FULLSCREEN_EXIT,    // User exited fullscreen
        PROGRESS_UPDATE,    // Periodic progress update
        VIDEO_COMPLETE,     // Video fully watched
        SESSION_END,        // User closed/left the page
        VIOLATION           // Any rule violation
    }
}

