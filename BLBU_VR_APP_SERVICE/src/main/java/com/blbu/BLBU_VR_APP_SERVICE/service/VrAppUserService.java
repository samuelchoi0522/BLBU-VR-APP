package com.blbu.BLBU_VR_APP_SERVICE.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.blbu.BLBU_VR_APP_SERVICE.model.User;
import com.blbu.BLBU_VR_APP_SERVICE.model.VRAppUser;
import com.blbu.BLBU_VR_APP_SERVICE.model.VideoCompletion;
import com.blbu.BLBU_VR_APP_SERVICE.repository.UserRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VRAppUserRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoCompletionRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoWatchEventRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VrAppUserService {

    @Autowired
    VRAppUserRepository vrAppUserRepository;

    @Autowired
    VideoCompletionRepository videoCompletionRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    VideoWatchEventRepository videoWatchEventRepository;

    public List<VRAppUser> getAllVRAppUsers() {
        return vrAppUserRepository.findAll();
    }

    public List<VRAppUser> getActiveVRAppUsers() {
        return vrAppUserRepository.findByActiveTrue();
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

        // Get user's current day
        Optional<VRAppUser> userOpt = vrAppUserRepository.findByEmail(email);
        int currentDay = userOpt.map(VRAppUser::getCurrentDay).orElse(1);

        Map<String, Object> progress = new HashMap<>();
        progress.put("completedDates", completedDates);
        progress.put("streak", streak);
        progress.put("totalCompleted", totalCompleted);
        progress.put("todayCompleted", todayCompleted);
        progress.put("currentDay", currentDay);

        return progress;
    }

    public VRAppUser updateUserActiveStatus(String email, boolean active) {
        // First try to find in vr_app_users table
        VRAppUser vrUser = vrAppUserRepository.findByEmail(email).orElse(null);
        
        if (vrUser == null) {
            // If not found, check if user exists in users table (might be an old user)
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            
            // Only create VRAppUser if the user is not an admin
            if (user.getRole() != null && !user.getRole().equalsIgnoreCase("admin")) {
                // Create new VRAppUser record
                vrUser = VRAppUser.builder()
                        .email(email)
                        .firstName("User") // Default values - admin should update these
                        .lastName("")
                        .active(active)
                        .currentDay(1) // Start at day 1
                        .build();
                vrUser = vrAppUserRepository.save(vrUser);
            } else {
                throw new RuntimeException("Cannot set active status for admin user: " + email);
            }
        } else {
            // Update existing VRAppUser
            vrUser.setActive(active);
            vrUser = vrAppUserRepository.save(vrUser);
        }
        
        return vrUser;
    }

    /**
     * Get today's completion status for active users only
     * Returns users who completed and users who didn't complete today's video
     */
    public Map<String, Object> getTodaysCompletionStatus() {
        LocalDate today = LocalDate.now();
        List<VRAppUser> allUsers = getActiveVRAppUsers(); // Only get active users
        
        List<Map<String, Object>> completedUsers = new ArrayList<>();
        List<Map<String, Object>> notCompletedUsers = new ArrayList<>();
        
        for (VRAppUser user : allUsers) {
            boolean completed = existsByEmailAndDate(user.getEmail(), today);
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("email", user.getEmail());
            userInfo.put("firstName", user.getFirstName());
            userInfo.put("lastName", user.getLastName());
            userInfo.put("displayName", user.getFirstName() + " " + user.getLastName());
            
            if (completed) {
                completedUsers.add(userInfo);
            } else {
                notCompletedUsers.add(userInfo);
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("date", today.toString());
        result.put("completedUsers", completedUsers);
        result.put("notCompletedUsers", notCompletedUsers);
        result.put("totalUsers", allUsers.size());
        result.put("completedCount", completedUsers.size());
        result.put("notCompletedCount", notCompletedUsers.size());
        
        return result;
    }

    private boolean existsByEmailAndDate(String email, LocalDate date) {
        List<VideoCompletion> completions = videoCompletionRepository.findAllByEmail(email);
        return completions.stream()
                .anyMatch(c -> c.getCompletedAt().toLocalDate().equals(date));
    }

    /**
     * Delete a user and all their related data (VideoCompletion, VideoWatchEvent, VRAppUser, User)
     */
    @Transactional
    public boolean deleteUser(String email) {
        // Check if user exists
        Optional<VRAppUser> vrUserOpt = vrAppUserRepository.findByEmail(email);
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (vrUserOpt.isEmpty() && userOpt.isEmpty()) {
            return false;
        }

        // Don't allow deleting admin users
        if (userOpt.isPresent() && userOpt.get().getRole() != null && 
            userOpt.get().getRole().equalsIgnoreCase("admin")) {
            throw new IllegalArgumentException("Cannot delete admin users");
        }

        // Delete related data first (foreign key constraints)
        System.out.println("Deleting watch events for user: " + email);
        videoWatchEventRepository.deleteAllByEmail(email);
        
        System.out.println("Deleting video completions for user: " + email);
        List<VideoCompletion> completions = videoCompletionRepository.findAllByEmail(email);
        videoCompletionRepository.deleteAll(completions);

        // Delete VRAppUser if exists
        if (vrUserOpt.isPresent()) {
            System.out.println("Deleting VRAppUser: " + email);
            vrAppUserRepository.delete(vrUserOpt.get());
        }

        // Delete User if exists
        if (userOpt.isPresent()) {
            System.out.println("Deleting User: " + email);
            userRepository.delete(userOpt.get());
        }

        System.out.println("Successfully deleted user and all related data: " + email);
        return true;
    }

    /**
     * Update user's current day
     */
    public VRAppUser updateUserCurrentDay(String email, Integer currentDay) {
        VRAppUser user = vrAppUserRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        user.setCurrentDay(currentDay);
        return vrAppUserRepository.save(user);
    }
}
