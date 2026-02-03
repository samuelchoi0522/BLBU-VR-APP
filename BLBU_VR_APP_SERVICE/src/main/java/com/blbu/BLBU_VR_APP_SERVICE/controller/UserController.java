package com.blbu.BLBU_VR_APP_SERVICE.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blbu.BLBU_VR_APP_SERVICE.model.User;
import com.blbu.BLBU_VR_APP_SERVICE.model.VRAppUser;
import com.blbu.BLBU_VR_APP_SERVICE.service.UserService;
import com.blbu.BLBU_VR_APP_SERVICE.service.VrAppUserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final VrAppUserService vrAppUserService;

    public UserController(UserService userService, VrAppUserService vrAppUserService) {
        this.userService = userService;
        this.vrAppUserService = vrAppUserService;
    }


    // Return ALL users (admins + vrapp users)
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        List<User> allUsers = userService.getAllUsers();
        // Filter to only get admin users (exclude regular users since they're in vr_app_users)
        List<User> admins = allUsers.stream()
                .filter(u -> u.getRole() != null && u.getRole().equalsIgnoreCase("admin"))
                .collect(java.util.stream.Collectors.toList());
        List<VRAppUser> vrUsers = vrAppUserService.getAllVRAppUsers();

        Map<String, Object> response = new HashMap<>();
        response.put("adminUsers", admins);
        response.put("vrAppUsers", vrUsers);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/video-completions")
    public ResponseEntity<?> getUserVideoCompletions(@RequestParam String email) {
        VRAppUser user = vrAppUserService.getAllVRAppUsers().stream()
                .filter(u -> u.getEmail().equalsIgnoreCase(email))
                .findFirst()
                .orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        List<String> completedDates = vrAppUserService.getCompletedDatesForUser(email);

        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("completedDates", completedDates);

        return ResponseEntity.ok(response);
    }

    /**
     * Get user progress including streak, completed dates, and today's status
     */
    @GetMapping("/progress")
    public ResponseEntity<?> getUserProgress(@RequestParam String email) {
        Map<String, Object> progress = vrAppUserService.getUserProgress(email);
        return ResponseEntity.ok(progress);
    }

    /**
     * Get only VR app users (non-admin users) for filtering
     */
    @GetMapping("/vr-users")
    public ResponseEntity<List<VRAppUser>> getVRAppUsers() {
        List<VRAppUser> vrUsers = vrAppUserService.getAllVRAppUsers();
        return ResponseEntity.ok(vrUsers);
    }

    /**
     * Get today's completion status - who completed and who didn't (only active users)
     */
    @GetMapping("/todays-completion-status")
    public ResponseEntity<?> getTodaysCompletionStatus() {
        Map<String, Object> status = vrAppUserService.getTodaysCompletionStatus();
        return ResponseEntity.ok(status);
    }

    /**
     * Update user active status
     */
    @PostMapping("/toggle-active")
    public ResponseEntity<?> toggleUserActiveStatus(@RequestParam String email, @RequestParam boolean active) {
        try {
            VRAppUser user = vrAppUserService.updateUserActiveStatus(email, active);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "email", user.getEmail(),
                    "active", user.getActive()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a user and all their related data
     */
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteUser(@RequestParam String email) {
        try {
            boolean deleted = vrAppUserService.deleteUser(email);
            if (deleted) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "User and all related data deleted successfully"
                ));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete user: " + e.getMessage()));
        }
    }

}
