package com.blbu.BLBU_VR_APP_SERVICE.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoWatchEvent;
import com.blbu.BLBU_VR_APP_SERVICE.service.VideoWatchService;
import com.blbu.BLBU_VR_APP_SERVICE.service.VideoWatchService.VideoWatchEventDTO;
import com.blbu.BLBU_VR_APP_SERVICE.service.VideoWatchService.VideoWatchEventRequest;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/video-watch")
public class VideoWatchController {

    private final VideoWatchService videoWatchService;

    public VideoWatchController(VideoWatchService videoWatchService) {
        this.videoWatchService = videoWatchService;
    }

    /**
     * Record a video watch event from the user's player
     */
    @PostMapping("/event")
    public ResponseEntity<?> recordEvent(
            @RequestBody VideoWatchEventRequest request,
            HttpServletRequest httpRequest) {
        
        // Add IP and user agent from request
        request.setIpAddress(getClientIp(httpRequest));
        request.setUserAgent(httpRequest.getHeader("User-Agent"));

        VideoWatchEvent event = videoWatchService.recordEvent(request);
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "eventId", event.getId()
        ));
    }

    /**
     * Check if a seek is valid (for the player to verify before allowing)
     */
    @PostMapping("/check-seek")
    public ResponseEntity<?> checkSeek(@RequestBody Map<String, Object> request) {
        String sessionId = (String) request.get("sessionId");
        Double fromTime = ((Number) request.get("fromTime")).doubleValue();
        Double toTime = ((Number) request.get("toTime")).doubleValue();

        boolean isValid = videoWatchService.isSeekValid(sessionId, fromTime, toTime);
        Double maxWatched = videoWatchService.getMaxWatchedPosition(sessionId);

        return ResponseEntity.ok(Map.of(
                "valid", isValid,
                "maxWatchedPosition", maxWatched
        ));
    }

    /**
     * Get the max position watched for a session
     */
    @GetMapping("/max-position/{sessionId}")
    public ResponseEntity<?> getMaxPosition(@PathVariable String sessionId) {
        Double maxWatched = videoWatchService.getMaxWatchedPosition(sessionId);
        return ResponseEntity.ok(Map.of("maxWatchedPosition", maxWatched));
    }

    /**
     * Check if a video was fully watched by a user
     */
    @GetMapping("/is-complete")
    public ResponseEntity<?> isVideoComplete(
            @RequestParam String email,
            @RequestParam Long videoId) {
        boolean complete = videoWatchService.isVideoFullyWatched(email, videoId);
        return ResponseEntity.ok(Map.of("complete", complete));
    }

    /**
     * Get recent events for admin dashboard
     */
    @GetMapping("/recent-events")
    public ResponseEntity<List<VideoWatchEventDTO>> getRecentEvents(
            @RequestParam(defaultValue = "60") int minutes) {
        List<VideoWatchEvent> events = videoWatchService.getRecentEvents(minutes);
        List<VideoWatchEventDTO> dtos = events.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get latest 100 events
     */
    @GetMapping("/latest-events")
    public ResponseEntity<List<VideoWatchEventDTO>> getLatestEvents() {
        List<VideoWatchEvent> events = videoWatchService.getLatestEvents();
        List<VideoWatchEventDTO> dtos = events.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get violations for admin review
     */
    @GetMapping("/violations")
    public ResponseEntity<List<VideoWatchEventDTO>> getViolations() {
        List<VideoWatchEvent> events = videoWatchService.getViolations();
        List<VideoWatchEventDTO> dtos = events.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get events for a specific session
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<VideoWatchEventDTO>> getSessionEvents(
            @PathVariable String sessionId) {
        List<VideoWatchEvent> events = videoWatchService.getSessionEvents(sessionId);
        List<VideoWatchEventDTO> dtos = events.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    private VideoWatchEventDTO toDTO(VideoWatchEvent event) {
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
        return dto;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

