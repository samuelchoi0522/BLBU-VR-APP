package com.blbu.BLBU_VR_APP_SERVICE.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoMetadata;
import com.blbu.BLBU_VR_APP_SERVICE.service.VideoService;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoService videoService;

    public VideoController(VideoService videoService) {
        this.videoService = videoService;
    }

    /**
     * Generates a signed URL for direct upload to GCS.
     * This allows the frontend to upload large files (up to 10GB) directly to GCS.
     */
    @PostMapping("/generate-upload-url")
    public ResponseEntity<?> generateUploadUrl(
            @RequestParam("filename") String filename,
            @RequestParam(value = "contentType", defaultValue = "video/mp4") String contentType) {
        try {
            Map<String, String> result = videoService.generateSignedUploadUrl(filename, contentType);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error generating upload URL: " + e.getMessage()));
        }
    }

    /**
     * Confirms the upload completion and saves video metadata.
     * Called by the frontend after successfully uploading to GCS.
     */
    @PostMapping("/confirm-upload")
    public ResponseEntity<String> confirmUpload(
            @RequestParam("filename") String filename,
            @RequestParam("title") String title,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            String url = videoService.confirmUploadAndAssign(filename, title, date);
            return ResponseEntity.ok("Assigned video for " + date + " at " + url);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error confirming upload: " + e.getMessage());
        }
    }

    @PutMapping("/assign")
    public ResponseEntity<String> updateAssignment(
            @RequestParam("filename") String filename,
            @RequestParam("title") String title,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        try {
            videoService.updateMetadata(filename, title, date);
            return ResponseEntity.ok("Updated video metadata");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating video: " + e.getMessage());
        }
    }


    @GetMapping("/today")
    public ResponseEntity<String> getTodaysVideo() {
        try {
            VideoMetadata metadata = videoService.getVideoForDate(LocalDate.now());
            String publicUrl = videoService.getVideoPublicUrl(metadata.getFilename());
            return ResponseEntity.ok(publicUrl);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error fetching today's video: " + e.getMessage());
        }
    }

    /**
     * Get today's video with full metadata (id, title, url)
     */
    @GetMapping("/today/metadata")
    public ResponseEntity<?> getTodaysVideoMetadata() {
        try {
            VideoMetadata metadata = videoService.getVideoForDate(LocalDate.now());
            String publicUrl = videoService.getVideoPublicUrl(metadata.getFilename());
            return ResponseEntity.ok(Map.of(
                    "id", metadata.getId(),
                    "title", metadata.getTitle() != null ? metadata.getTitle() : "Today's Session",
                    "url", publicUrl,
                    "assignedDate", metadata.getAssignedDate().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No video scheduled for today"));
        }
    }

    @GetMapping("/{date}")
    public ResponseEntity<String> getVideoForDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            VideoMetadata metadata = videoService.getVideoForDate(date);
            String publicUrl = videoService.getVideoPublicUrl(metadata.getFilename());
            return ResponseEntity.ok(publicUrl);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error fetching video for date " + date + ": " + e.getMessage());
        }
    }

    @DeleteMapping("/date/{date}")
    public ResponseEntity<String> deleteVideoForDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            boolean deleted = videoService.deleteVideoByDate(date);
            if (deleted) {
                return ResponseEntity.ok("Video and metadata deleted for date: " + date);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No video found for date: " + date);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting video: " + e.getMessage());
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getVideoCount() {
        try {
            long count = videoService.getTotalVideoCount();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/get-all-videos")
    public ResponseEntity<?> getAllVideos() {
        try {
            Iterable<VideoMetadata> videos = videoService.getAllVideos();
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching all videos: " + e.getMessage());
        }
    }

    @DeleteMapping("/file/{filename:.+}")
    public ResponseEntity<String> deleteVideoByFilename(@PathVariable String filename) {
        try {
            boolean deleted = videoService.deleteVideoByFilename(filename);
            if (deleted) {
                return ResponseEntity.ok("Video and metadata deleted for filename: " + filename);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No video found for filename: " + filename);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting video: " + e.getMessage());
        }
    }

    @PostMapping("/save-video-completion")
    public ResponseEntity<String> saveVideoCompletion(
            @RequestParam("email") String email,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            videoService.recordVideoCompletion(email, date);
            return ResponseEntity.ok("Recorded video completion for " + email + " on " + date);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error recording video completion: " + e.getMessage());
        }
    }

}
