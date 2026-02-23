package com.blbu.BLBU_VR_APP_SERVICE.service;

import java.io.IOException;
import java.net.URL;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoCompletion;
import com.blbu.BLBU_VR_APP_SERVICE.model.VideoMetadata;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoCompletionRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoMetadataRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoWatchEventRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VRAppUserRepository;
import com.blbu.BLBU_VR_APP_SERVICE.model.VRAppUser;
import java.util.List;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.HttpMethod;
import com.google.cloud.storage.Storage;

@Service
public class VideoService {

    private final Storage storage;
    private final VideoMetadataRepository repository;
    private final String bucketName = "vr_therapy_videos";
    private final VideoCompletionRepository completionRepository;
    private final VideoWatchEventRepository watchEventRepository;
    private final VRAppUserRepository vrAppUserRepository;

    public VideoService(Storage storage, VideoMetadataRepository repository, 
                       VideoCompletionRepository completionRepository,
                       VideoWatchEventRepository watchEventRepository,
                       VRAppUserRepository vrAppUserRepository) {
        this.storage = storage;
        this.repository = repository;
        this.completionRepository = completionRepository;
        this.watchEventRepository = watchEventRepository;
        this.vrAppUserRepository = vrAppUserRepository;
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

        URL signedUrl;
        try {
            // Try to get service account credentials for signing
            GoogleCredentials credentials = GoogleCredentials.getApplicationDefault();
            
            if (credentials instanceof ServiceAccountCredentials) {
                // Use service account credentials directly for signing
                ServiceAccountCredentials saCredentials = (ServiceAccountCredentials) credentials;
                signedUrl = storage.signUrl(
                        blobInfo,
                        2,
                        TimeUnit.HOURS,
                        Storage.SignUrlOption.httpMethod(HttpMethod.PUT),
                        Storage.SignUrlOption.withContentType(),
                        Storage.SignUrlOption.signWith(saCredentials)
                );
            } else {
                // For user credentials or other credential types, use the default signer
                // This requires the iam.serviceAccounts.signBlob permission
                signedUrl = storage.signUrl(
                        blobInfo,
                        2,
                        TimeUnit.HOURS,
                        Storage.SignUrlOption.httpMethod(HttpMethod.PUT),
                        Storage.SignUrlOption.withContentType()
                );
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to get credentials for signing URL: " + e.getMessage(), e);
        }

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
     * @param displayOrder The display order (1-7) for the video sequence
     * @return The GCS URL of the uploaded video
     */
    public String confirmUploadAndAssign(String filename, String title, Integer displayOrder) {
        // Verify the file exists in GCS
        Blob blob = storage.get(BlobId.of(bucketName, filename));
        if (blob == null) {
            throw new RuntimeException("File not found in GCS: " + filename);
        }

        String gcsUrl = String.format("https://storage.googleapis.com/%s/%s", bucketName, filename);

        // Save or update metadata
        Optional<VideoMetadata> existing = repository.findByFilename(filename);
        VideoMetadata metadata = existing.orElse(new VideoMetadata());
        metadata.setFilename(filename);
        metadata.setTitle(title);
        metadata.setGcsUrl(gcsUrl);
        if (displayOrder != null) {
            metadata.setDisplayOrder(displayOrder);
        }
        repository.save(metadata);

        System.out.println("Confirmed upload for video: " + title + " (order: " + displayOrder + ") -> " + gcsUrl);
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


    @Transactional
    public boolean deleteVideoByDate(LocalDate date) {
        Optional<VideoMetadata> existing = repository.findByAssignedDate(date);
        if (existing.isEmpty()) {
            System.out.println("No video metadata found for date: " + date);
            return false;
        }

        VideoMetadata metadata = existing.get();
        Long videoId = metadata.getId();
        String filename = metadata.getFilename();
        System.out.println("Deleting video: " + filename + " (id=" + videoId + ") from bucket=" + bucketName);

        try {
            // Delete related records first (foreign key constraints)
            System.out.println("Deleting related watch events...");
            watchEventRepository.deleteAllByVideoId(videoId);
            
            System.out.println("Deleting related completions...");
            completionRepository.deleteAllByVideoId(videoId);

            // Delete from GCS
            boolean deleted = storage.delete(BlobId.of(bucketName, filename));
            if (!deleted) {
                System.out.println("️GCS object not found or already deleted: " + filename);
            }

            // Delete metadata from DB
            repository.delete(metadata);
            System.out.println("Deleted metadata and video for date: " + date);
            return true;
        } catch (Exception e) {
            System.out.println("Failed to delete video: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public int getTotalVideoCount() {
        return (int) repository.count();
    }

    public Iterable<VideoMetadata> getAllVideos() {
        return repository.findAll();
    }

    @Transactional
    public boolean deleteVideoByFilename(String filename) {
        Optional<VideoMetadata> existing = repository.findByFilename(filename);
        if (existing.isEmpty()) {
            System.out.println("No video metadata found for filename: " + filename);
            return false;
        }

        VideoMetadata metadata = existing.get();
        Long videoId = metadata.getId();
        System.out.println("Deleting video: " + filename + " (id=" + videoId + ") from bucket=" + bucketName);

        try {
            // Delete related records first (foreign key constraints)
            System.out.println("Deleting related watch events...");
            watchEventRepository.deleteAllByVideoId(videoId);
            
            System.out.println("Deleting related completions...");
            completionRepository.deleteAllByVideoId(videoId);

            // Delete from GCS
            boolean deleted = storage.delete(BlobId.of(bucketName, filename));
            if (!deleted) {
                System.out.println("️GCS object not found or already deleted: " + filename);
            }

            // Delete metadata from DB
            repository.delete(metadata);
            System.out.println("Deleted metadata and video for filename: " + filename);
            return true;
        } catch (Exception e) {
            System.out.println("Failed to delete video: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public String updateMetadata(String filename, String newTitle, Integer displayOrder) {
        VideoMetadata metadata = repository.findByFilename(filename)
                .orElseThrow(() -> new RuntimeException("Video not found for filename: " + filename));

        metadata.setTitle(newTitle);
        if (displayOrder != null) {
            metadata.setDisplayOrder(displayOrder);
        }
        metadata.setUpdatedAt(LocalDateTime.now());

        repository.save(metadata);

        return "Updated metadata for video: " + filename;
    }

    public boolean isVideoCompleted(String email, LocalDate date) {
        try {
            Optional<VideoMetadata> videoOpt = repository.findByAssignedDate(date);
            if (videoOpt.isEmpty()) {
                return false;
            }
            VideoMetadata video = videoOpt.get();
            Optional<VideoCompletion> completion = completionRepository.findByEmailAndVideo_Id(email, video.getId());
            return completion.isPresent();
        } catch (Exception e) {
            System.err.println("Error checking video completion: " + e.getMessage());
            return false;
        }
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

    /**
     * Get video for a user based on their current day
     * Day 1-2: Video with displayOrder=1
     * Day 3-4: Video with displayOrder=2
     * Day 5-6: Video with displayOrder=3
     * Day 7-8: Video with displayOrder=4
     * Day 9-10: Video with displayOrder=5
     * Day 11-12: Video with displayOrder=6
     * Day 13-14: Video with displayOrder=7
     */
    public VideoMetadata getVideoForUserDay(String email) {
        VRAppUser user = vrAppUserRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        
        int currentDay = user.getCurrentDay();
        // Calculate which video order (1-7) based on day
        // Days 1-2 -> order 1, Days 3-4 -> order 2, etc.
        int videoOrder = ((currentDay - 1) / 2) + 1;
        
        // Find video with this display order
        Optional<VideoMetadata> videoOpt = repository.findByDisplayOrder(videoOrder);
        
        if (videoOpt.isEmpty()) {
            throw new RuntimeException("No video found with display order " + videoOrder + " for user day " + currentDay);
        }
        
        return videoOpt.get();
    }

    /**
     * Update video display order
     */
    public void updateVideoDisplayOrder(Long videoId, Integer displayOrder) {
        VideoMetadata video = repository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Video not found: " + videoId));
        video.setDisplayOrder(displayOrder);
        repository.save(video);
    }

    /**
     * Check if user has completed their current video twice (required to advance)
     */
    public boolean hasCompletedVideoTwice(String email, Long videoId) {
        List<VideoCompletion> completions = completionRepository.findAllByEmail(email);
        long count = completions.stream()
                .filter(c -> c.getVideo().getId().equals(videoId))
                .count();
        return count >= 2;
    }

    /**
     * Record video completion and advance user day if they've completed the video twice
     */
    @Transactional
    public void recordVideoCompletionAndAdvance(String email) {
        VRAppUser user = vrAppUserRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        
        VideoMetadata currentVideo = getVideoForUserDay(email);
        
        // Record the completion
        VideoCompletion completion = VideoCompletion.builder()
                .email(email)
                .video(currentVideo)
                .completedAt(LocalDateTime.now())
                .build();
        completionRepository.save(completion);
        
        // Check if user has completed this video twice
        if (hasCompletedVideoTwice(email, currentVideo.getId())) {
            // Advance to next day
            user.setCurrentDay(user.getCurrentDay() + 1);
            vrAppUserRepository.save(user);
            System.out.println("User " + email + " advanced to day " + user.getCurrentDay());
        }
    }
}
