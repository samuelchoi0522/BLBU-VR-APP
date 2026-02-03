package com.blbu.BLBU_VR_APP_SERVICE.repository;

import com.blbu.BLBU_VR_APP_SERVICE.model.VRAppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VRAppUserRepository extends JpaRepository<VRAppUser, UUID> {
    Optional<VRAppUser> findByEmail(String email);
    List<VRAppUser> findByActiveTrue();
}
