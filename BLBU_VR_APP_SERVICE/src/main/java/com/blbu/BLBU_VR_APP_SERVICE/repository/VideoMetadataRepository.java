package com.blbu.BLBU_VR_APP_SERVICE.repository;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface VideoMetadataRepository extends JpaRepository<VideoMetadata, Long> {
    Optional<VideoMetadata> findByAssignedDate(LocalDate date);
}
