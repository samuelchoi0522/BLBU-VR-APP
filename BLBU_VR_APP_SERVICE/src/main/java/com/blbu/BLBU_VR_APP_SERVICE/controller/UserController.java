package com.blbu.BLBU_VR_APP_SERVICE.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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
        List<User> admins = userService.getAllUsers();
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

}
