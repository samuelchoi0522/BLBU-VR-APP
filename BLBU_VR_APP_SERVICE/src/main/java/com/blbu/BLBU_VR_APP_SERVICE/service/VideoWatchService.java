package com.blbu.BLBU_VR_APP_SERVICE.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoMetadata;
import com.blbu.BLBU_VR_APP_SERVICE.model.VideoWatchEvent;
import com.blbu.BLBU_VR_APP_SERVICE.model.VideoWatchEvent.EventType;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoMetadataRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoWatchEventRepository;

import lombok.Data;

@Service
public class VideoWatchService {

    private final VideoWatchEventRepository eventRepository;
    private final VideoMetadataRepository videoRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // Track active sessions and their max watched position
    private final Map<String, Double> sessionMaxPosition = new ConcurrentHashMap<>();

    public VideoWatchService(
            VideoWatchEventRepository eventRepository,
            VideoMetadataRepository videoRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.eventRepository = eventRepository;
        this.videoRepository = videoRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Record a video watch event and broadcast it to admin dashboard
     */
    public VideoWatchEvent recordEvent(VideoWatchEventRequest request) {
        VideoMetadata video = null;
        if (request.getVideoId() != null) {
            video = videoRepository.findById(request.getVideoId()).orElse(null);
        }

        VideoWatchEvent event = VideoWatchEvent.builder()
                .email(request.getEmail())
                .sessionId(request.getSessionId())
                .video(video)
                .eventType(request.getEventType())
                .videoTime(request.getVideoTime())
                .videoDuration(request.getVideoDuration())
                .percentWatched(calculatePercentWatched(request))
                .details(request.getDetails())
                .timestamp(LocalDateTime.now())
                .ipAddress(request.getIpAddress())
                .userAgent(request.getUserAgent())
                .build();

        // Save to database
        event = eventRepository.save(event);

        // Broadcast to admin dashboard via WebSocket
        broadcastEvent(event);

        // Track max position for seek detection
        if (request.getVideoTime() != null) {
            String key = request.getSessionId();
            Double currentMax = sessionMaxPosition.getOrDefault(key, 0.0);
            if (request.getVideoTime() > currentMax) {
                sessionMaxPosition.put(key, request.getVideoTime());
            }
        }

        return event;
    }

    /**
     * Check if a seek attempt is valid (can only seek backwards or to already watched positions)
     */
    public boolean isSeekValid(String sessionId, Double fromTime, Double toTime) {
        Double maxWatched = sessionMaxPosition.getOrDefault(sessionId, 0.0);
        // Can seek backwards or to any position already watched
        return toTime <= maxWatched + 2.0; // 2 second tolerance
    }

    /**
     * Get max position watched for a session
     */
    public Double getMaxWatchedPosition(String sessionId) {
        return sessionMaxPosition.getOrDefault(sessionId, 0.0);
    }

    /**
     * Clear session tracking when session ends
     */
    public void clearSession(String sessionId) {
        sessionMaxPosition.remove(sessionId);
    }

    /**
     * Verify if a video was fully watched
     */
    public boolean isVideoFullyWatched(String email, Long videoId) {
        return eventRepository.countCompletionsForUserAndVideo(email, videoId) > 0;
    }

    /**
     * Get recent events for admin dashboard
     */
    public List<VideoWatchEvent> getRecentEvents(int minutes) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
        return eventRepository.findRecentEvents(since);
    }

    /**
     * Get all events for a session
     */
    public List<VideoWatchEvent> getSessionEvents(String sessionId) {
        return eventRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    /**
     * Get violations (seek attempts, etc.)
     */
    public List<VideoWatchEvent> getViolations() {
        return eventRepository.findViolations();
    }

    /**
     * Get latest events
     */
    public List<VideoWatchEvent> getLatestEvents() {
        return eventRepository.findTop100ByOrderByTimestampDesc();
    }

    private Double calculatePercentWatched(VideoWatchEventRequest request) {
        if (request.getVideoTime() != null && request.getVideoDuration() != null 
                && request.getVideoDuration() > 0) {
            return (request.getVideoTime() / request.getVideoDuration()) * 100;
        }
        return null;
    }

    private void broadcastEvent(VideoWatchEvent event) {
        // Create a simplified DTO for broadcasting
        VideoWatchEventDTO dto = new VideoWatchEventDTO();
        dto.setId(event.getId());
        dto.setEmail(event.getEmail());
        dto.setSessionId(event.getSessionId());
        dto.setVideoTitle(event.getVideo() != null ? event.getVideo().getTitle() : "Unknown");
        dto.setEventType(event.getEventType().name());
        dto.setVideoTime(event.getVideoTime());
        dto.setVideoDuration(event.getVideoDuration());
        dto.setPercentWatched(event.getPercentWatched());
        dto.setDetails(event.getDetails());
        dto.setTimestamp(event.getTimestamp().toString());

        // Send to /topic/video-events
        messagingTemplate.convertAndSend("/topic/video-events", dto);
    }

    @Data
    public static class VideoWatchEventRequest {
        private String email;
        private String sessionId;
        private Long videoId;
        private EventType eventType;
        private Double videoTime;
        private Double videoDuration;
        private String details;
        private String ipAddress;
        private String userAgent;
    }

    @Data
    public static class VideoWatchEventDTO {
        private Long id;
        private String email;
        private String sessionId;
        private String videoTitle;
        private String eventType;
        private Double videoTime;
        private Double videoDuration;
        private Double percentWatched;
        private String details;
        private String timestamp;
    }
}

