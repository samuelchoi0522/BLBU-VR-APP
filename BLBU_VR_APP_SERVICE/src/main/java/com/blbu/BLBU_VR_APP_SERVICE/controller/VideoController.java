package com.blbu.BLBU_VR_APP_SERVICE.controller;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoMetadata;
import com.blbu.BLBU_VR_APP_SERVICE.service.VideoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoService videoService;

    public VideoController(VideoService videoService) {
        this.videoService = videoService;
    }

    @PostMapping("/assign")
    public ResponseEntity<String> assignVideoToDate(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean compress,
            @RequestParam("title") String title,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            String url = videoService.uploadAndAssignVideo(file, title, compress, date);
            return ResponseEntity.ok("Assigned video for " + date + " at " + url);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning video: " + e.getMessage());
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

    @DeleteMapping("/file/{filename}")
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
