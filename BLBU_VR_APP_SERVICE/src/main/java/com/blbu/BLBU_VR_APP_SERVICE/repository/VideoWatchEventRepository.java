package com.blbu.BLBU_VR_APP_SERVICE.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoWatchEvent;

@Repository
public interface VideoWatchEventRepository extends JpaRepository<VideoWatchEvent, Long> {

    List<VideoWatchEvent> findByEmailOrderByTimestampDesc(String email);

    List<VideoWatchEvent> findBySessionIdOrderByTimestampAsc(String sessionId);

    List<VideoWatchEvent> findByTimestampAfterOrderByTimestampDesc(LocalDateTime after);

    @Query("SELECT e FROM VideoWatchEvent e WHERE e.timestamp > :since ORDER BY e.timestamp DESC")
    List<VideoWatchEvent> findRecentEvents(LocalDateTime since);

    @Query("SELECT e FROM VideoWatchEvent e WHERE e.eventType = 'VIOLATION' OR e.eventType = 'SEEK_ATTEMPT' ORDER BY e.timestamp DESC")
    List<VideoWatchEvent> findViolations();

    @Query("SELECT COUNT(e) FROM VideoWatchEvent e WHERE e.email = :email AND e.eventType = 'VIDEO_COMPLETE' AND e.video.id = :videoId")
    long countCompletionsForUserAndVideo(String email, Long videoId);

    List<VideoWatchEvent> findTop100ByOrderByTimestampDesc();

    // Delete all watch events for a specific video
    @Modifying
    @Query("DELETE FROM VideoWatchEvent e WHERE e.video.id = :videoId")
    void deleteAllByVideoId(Long videoId);
}

