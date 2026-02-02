package com.blbu.BLBU_VR_APP_SERVICE.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.blbu.BLBU_VR_APP_SERVICE.model.User;
import com.blbu.BLBU_VR_APP_SERVICE.model.VRAppUser;
import com.blbu.BLBU_VR_APP_SERVICE.security.JwtUtil;
import com.blbu.BLBU_VR_APP_SERVICE.service.UserService;

import lombok.Data;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    // Register new user
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userService.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }
        userService.registerUser(user);
        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }

    // Login existing user
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        boolean isValid = userService.validateUserCredentials(loginRequest.getEmail(), loginRequest.getPassword());
        if (!isValid) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        User user = userService.findByEmail(loginRequest.getEmail()).orElse(null);
        String role = user != null && user.getRole() != null ? user.getRole().toLowerCase() : "user";
        
        String token = jwtUtil.generateToken(loginRequest.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "Login successful", 
                "token", token,
                "role", role,
                "email", loginRequest.getEmail()
        ));
    }

    // Check session validity
    @GetMapping("/check-session")
    public ResponseEntity<?> checkSession(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("valid", false, "error", "Missing or invalid Authorization header"));
        }

        String token = authHeader.substring(7);
        boolean isValid = jwtUtil.validateToken(token);
        if (!isValid) {
            return ResponseEntity.status(401).body(Map.of("valid", false, "error", "Invalid or expired token"));
        }

        String email = jwtUtil.extractEmail(token);
        User user = userService.findByEmail(email).orElse(null);
        String role = user != null && user.getRole() != null ? user.getRole().toLowerCase() : "user";
        
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "email", email,
                "role", role,
                "message", "Session is active"
        ));
    }

    @GetMapping("/get-total-users")
    public ResponseEntity<?> getTotalUsers() {
        long totalUsers = userService.getTotalUsers();
        return ResponseEntity.ok(Map.of("totalUsers", totalUsers));
    }

    @PostMapping("/register-user-from-vrapp")
    public ResponseEntity<?> registerUserFromVrApp(@RequestBody VRAppUser user) {
        if (userService.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }
        userService.registerVRAppUser(user);
        return ResponseEntity.ok(Map.of("message", "User registered successfully from VR app"));
    }
}

@Data
class LoginRequest {
    private String email;
    private String password;
}
