package com.blbu.BLBU_VR_APP_SERVICE.service;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoCompletion;
import com.blbu.BLBU_VR_APP_SERVICE.model.VideoMetadata;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoCompletionRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoMetadataRepository;
import com.google.cloud.storage.*;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URL;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class VideoService {

    private final Storage storage;
    private final VideoMetadataRepository repository;
    private final String bucketName = "vr_therapy_videos";
    private final VideoCompletionRepository completionRepository;

    public VideoService(Storage storage, VideoMetadataRepository repository, VideoCompletionRepository completionRepository) {
        this.storage = storage;
        this.repository = repository;
        this.completionRepository = completionRepository;
    }

    /**
     * Generates a signed URL for direct upload to GCS.
     * This allows clients to upload large files (up to 10GB) directly to GCS.
     *
     * @param originalFilename The original filename from the client
     * @param contentType The content type of the file being uploaded
     * @return A map containing the signed URL and the generated filename
     */
    public Map<String, String> generateSignedUploadUrl(String originalFilename, String contentType) {
        // Generate a unique filename to avoid collisions
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String generatedFilename = UUID.randomUUID().toString() + extension;

        BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(bucketName, generatedFilename))
                .setContentType(contentType != null ? contentType : "video/mp4")
                .build();

        // Generate a signed URL valid for 2 hours (enough time for large uploads)
        URL signedUrl = storage.signUrl(
                blobInfo,
                2,
                TimeUnit.HOURS,
                Storage.SignUrlOption.httpMethod(HttpMethod.PUT),
                Storage.SignUrlOption.withContentType()
        );

        System.out.println("Generated signed upload URL for: " + generatedFilename);

        Map<String, String> result = new HashMap<>();
        result.put("signedUrl", signedUrl.toString());
        result.put("filename", generatedFilename);
        result.put("gcsUrl", String.format("https://storage.googleapis.com/%s/%s", bucketName, generatedFilename));
        return result;
    }

    /**
     * Confirms the upload completion and saves video metadata.
     * Called by the frontend after successfully uploading to GCS.
     *
     * @param filename The filename that was uploaded to GCS
     * @param title The video title
     * @param date The date to assign the video to
     * @return The GCS URL of the uploaded video
     */
    public String confirmUploadAndAssign(String filename, String title, LocalDate date) {
        // Verify the file exists in GCS
        Blob blob = storage.get(BlobId.of(bucketName, filename));
        if (blob == null) {
            throw new RuntimeException("File not found in GCS: " + filename);
        }

        String gcsUrl = String.format("https://storage.googleapis.com/%s/%s", bucketName, filename);

        // Save or update metadata
        Optional<VideoMetadata> existing = repository.findByAssignedDate(date);
        VideoMetadata metadata = existing.orElse(new VideoMetadata());
        metadata.setFilename(filename);
        metadata.setTitle(title);
        metadata.setGcsUrl(gcsUrl);
        metadata.setAssignedDate(date);
        repository.save(metadata);

        System.out.println("Confirmed upload and assigned video for " + date + " -> " + gcsUrl);
        return gcsUrl;
    }

    public VideoMetadata getVideoForDate(LocalDate date) {
        Optional<VideoMetadata> result = repository.findByAssignedDate(date);
        if (result.isEmpty()) {
            System.out.println("No DB record for date=" + date);
            throw new RuntimeException("No video assigned for date: " + date);
        }
        System.out.println("Found DB record for date=" + date + " filename=" + result.get().getFilename());
        return result.get();
    }

    public String getVideoPublicUrl(String filename) throws IOException {
        System.out.println("Fetching public URL for GCS object: " + filename);

        Blob blob = storage.get(BlobId.of(bucketName, filename));
        if (blob == null) {
            System.out.println("GCS file not found: " + filename);
            throw new IOException("Video not found in bucket: " + filename);
        }

        // If your bucket is public, this URL already works:
        return String.format("https://storage.googleapis.com/%s/%s", bucketName, filename);
    }


    public boolean deleteVideoByDate(LocalDate date) {
        Optional<VideoMetadata> existing = repository.findByAssignedDate(date);
        if (existing.isEmpty()) {
            System.out.println("No video metadata found for date: " + date);
            return false;
        }

        VideoMetadata metadata = existing.get();
        String filename = metadata.getFilename();
        System.out.println("Deleting video: " + filename + " from bucket=" + bucketName);

        try {
            // Delete from GCS
            boolean deleted = storage.delete(BlobId.of(bucketName, filename));
            if (!deleted) {
                System.out.println("️GCS object not found or already deleted: " + filename);
            }

            // Delete from DB
            repository.delete(metadata);
            System.out.println("Deleted metadata and video for date: " + date);
            return true;
        } catch (Exception e) {
            System.out.println("Failed to delete video: " + e.getMessage());
            return false;
        }
    }

    public int getTotalVideoCount() {
        return (int) repository.count();
    }

    public Iterable<VideoMetadata> getAllVideos() {
        return repository.findAll();
    }

    public boolean deleteVideoByFilename(String filename) {
        Optional<VideoMetadata> existing = repository.findByFilename(filename);
        if (existing.isEmpty()) {
            System.out.println("No video metadata found for filename: " + filename);
            return false;
        }

        VideoMetadata metadata = existing.get();
        System.out.println("Deleting video: " + filename + " from bucket=" + bucketName);

        try {
            // Delete from GCS
            boolean deleted = storage.delete(BlobId.of(bucketName, filename));
            if (!deleted) {
                System.out.println("️GCS object not found or already deleted: " + filename);
            }

            // Delete from DB
            repository.delete(metadata);
            System.out.println("Deleted metadata and video for filename: " + filename);
            return true;
        } catch (Exception e) {
            System.out.println("Failed to delete video: " + e.getMessage());
            return false;
        }
    }

    public String updateMetadata(String filename, String newTitle, LocalDate newDate) {
        VideoMetadata metadata = repository.findByFilename(filename)
                .orElseThrow(() -> new RuntimeException("Video not found for filename: " + filename));

        metadata.setTitle(newTitle);
        metadata.setAssignedDate(newDate);
        metadata.setUpdatedAt(LocalDateTime.now());

        repository.save(metadata);

        return "Updated metadata for video: " + filename;
    }

    public void recordVideoCompletion(String email, LocalDate date) {

        VideoMetadata video = repository.findByAssignedDate(date)
                .orElseThrow(() -> new RuntimeException("No video assigned for date: " + date));

        VideoCompletion completion = VideoCompletion.builder()
                .email(email)
                .video(video)
                .completedAt(LocalDateTime.now())
                .build();

        completionRepository.save(completion);
    }
}
