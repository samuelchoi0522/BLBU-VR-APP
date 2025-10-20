package com.blbu.BLBU_VR_APP_SERVICE.service;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoMetadata;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoMetadataRepository;
import com.blbu.BLBU_VR_APP_SERVICE.util.VideoCompressor;
import com.google.cloud.storage.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class VideoService {

    private final Storage storage;
    private final VideoMetadataRepository repository;
    private final String bucketName = "vr_therapy_videos";

    public VideoService(Storage storage, VideoMetadataRepository repository) {
        this.storage = storage;
        this.repository = repository;
    }

    public String uploadAndAssignVideo(MultipartFile file, boolean compress, LocalDate date) throws IOException {
        File tempFile = convertToFile(file);
        File uploadFile = compress ? VideoCompressor.compress(tempFile) : tempFile;

        BlobId blobId = BlobId.of(bucketName, uploadFile.getName());
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();

        System.out.println("Uploading to GCS bucket=" + bucketName + " object=" + uploadFile.getName());
        storage.create(blobInfo, Files.readAllBytes(uploadFile.toPath()));

        String gcsUrl = String.format("https://storage.googleapis.com/%s/%s", bucketName, uploadFile.getName());

        // Save or update metadata
        Optional<VideoMetadata> existing = repository.findByAssignedDate(date);
        VideoMetadata metadata = existing.orElse(new VideoMetadata());
        metadata.setFilename(uploadFile.getName());
        metadata.setGcsUrl(gcsUrl);
        metadata.setAssignedDate(date);
        repository.save(metadata);

        tempFile.delete();
        if (compress) uploadFile.delete();

        System.out.println("Assigned video for " + date + " -> " + gcsUrl);
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


    private File convertToFile(MultipartFile file) throws IOException {
        File convFile = File.createTempFile("upload-", "-" + file.getOriginalFilename());
        try (FileOutputStream fos = new FileOutputStream(convFile)) {
            fos.write(file.getBytes());
        }
        return convFile;
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

}
