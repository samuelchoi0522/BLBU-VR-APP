package com.blbu.BLBU_VR_APP_SERVICE.repository;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VideoCompletionRepository extends JpaRepository<VideoCompletion, Long> {

    // Find completion by email + video
    Optional<VideoCompletion> findByEmailAndVideo_Id(String email, Long videoId);

    // Get all completions for a specific user
    List<VideoCompletion> findAllByEmail(String email);

    // Get completions for a specific video
    List<VideoCompletion> findAllByVideo_Id(Long videoId);

    // Delete all completions for a specific video
    @Modifying
    @Query("DELETE FROM VideoCompletion vc WHERE vc.video.id = :videoId")
    void deleteAllByVideoId(Long videoId);
}
