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
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            String url = videoService.uploadAndAssignVideo(file, compress, date);
            return ResponseEntity.ok("Assigned video for " + date + " at " + url);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning video: " + e.getMessage());
        }
    }

    @PutMapping("/assign")
    public ResponseEntity<String> updateAssignment(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean compress,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return assignVideoToDate(file, compress, date);
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

    @DeleteMapping("/{date}")
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
}
