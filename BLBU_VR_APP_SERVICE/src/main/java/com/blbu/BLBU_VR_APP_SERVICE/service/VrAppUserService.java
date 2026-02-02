package com.blbu.BLBU_VR_APP_SERVICE.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.blbu.BLBU_VR_APP_SERVICE.model.VRAppUser;
import com.blbu.BLBU_VR_APP_SERVICE.model.VideoCompletion;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VRAppUserRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoCompletionRepository;

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

    /**
     * Calculate the current streak for a user.
     * A streak is the number of consecutive days the user has watched videos,
     * counting backwards from today (or yesterday if today hasn't been completed yet).
     */
    public int calculateStreak(String email) {
        List<String> completedDates = getCompletedDatesForUser(email);
        if (completedDates.isEmpty()) {
            return 0;
        }

        // Convert to LocalDate and sort in descending order
        Set<LocalDate> dateSet = new HashSet<>();
        for (String dateStr : completedDates) {
            dateSet.add(LocalDate.parse(dateStr));
        }

        LocalDate today = LocalDate.now();
        LocalDate checkDate = today;

        // If today hasn't been completed, start checking from yesterday
        if (!dateSet.contains(today)) {
            checkDate = today.minusDays(1);
            // If yesterday also wasn't completed, streak is 0
            if (!dateSet.contains(checkDate)) {
                return 0;
            }
        }

        int streak = 0;
        while (dateSet.contains(checkDate)) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }

        return streak;
    }

    /**
     * Get comprehensive progress data for a user
     */
    public Map<String, Object> getUserProgress(String email) {
        List<String> completedDates = getCompletedDatesForUser(email);
        int streak = calculateStreak(email);
        int totalCompleted = completedDates.size();
        
        // Check if today's video has been watched
        boolean todayCompleted = completedDates.contains(LocalDate.now().toString());

        Map<String, Object> progress = new HashMap<>();
        progress.put("completedDates", completedDates);
        progress.put("streak", streak);
        progress.put("totalCompleted", totalCompleted);
        progress.put("todayCompleted", todayCompleted);

        return progress;
    }
}
