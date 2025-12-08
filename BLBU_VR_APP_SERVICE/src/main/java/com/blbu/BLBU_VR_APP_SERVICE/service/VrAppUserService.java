package com.blbu.BLBU_VR_APP_SERVICE.service;

import com.blbu.BLBU_VR_APP_SERVICE.model.VRAppUser;
import com.blbu.BLBU_VR_APP_SERVICE.model.VideoCompletion;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VRAppUserRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoCompletionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class VrAppUserService {

    @Autowired
    VRAppUserRepository vrAppUserRepository;

    @Autowired
    VideoCompletionRepository videoCompletionRepository;

    public List<VRAppUser> getAllVRAppUsers() {
        return vrAppUserRepository.findAll();
    }

    public List<String> getCompletedDatesForUser(String email) {
        List<VideoCompletion> completions = videoCompletionRepository.findAllByEmail(email);

        List<String> dates = new ArrayList<>();
        for (VideoCompletion c : completions) {
            dates.add(c.getCompletedAt().toLocalDate().toString()); // "yyyy-mm-dd"
        }

        return dates;
    }
}
