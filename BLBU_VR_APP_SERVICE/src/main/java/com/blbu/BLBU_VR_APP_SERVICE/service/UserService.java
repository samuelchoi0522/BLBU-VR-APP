package com.blbu.BLBU_VR_APP_SERVICE.service;

import com.blbu.BLBU_VR_APP_SERVICE.model.User;
import com.blbu.BLBU_VR_APP_SERVICE.model.VRAppUser;
import com.blbu.BLBU_VR_APP_SERVICE.repository.UserRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VRAppUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VRAppUserRepository vrAppUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User registerUser(User user) {
        // Check if email already exists
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use: " + user.getEmail());
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Email already in use: " + user.getEmail(), e);
        }
    }

    public boolean validateUserCredentials(String email, String rawPassword) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isPresent()) {
            return passwordEncoder.matches(rawPassword, optionalUser.get().getPassword());
        }
        return false;
    }

    public void registerVRAppUser(VRAppUser vrAppUser) {
        // Check if email already exists
        if (userRepository.findByEmail(vrAppUser.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use: " + vrAppUser.getEmail());
        }
        
        // Save to main users table with role "user"
        User user = new User();
        user.setEmail(vrAppUser.getEmail());
        user.setPassword(passwordEncoder.encode(vrAppUser.getPassword()));
        user.setRole("user");
        
        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Email already in use: " + vrAppUser.getEmail(), e);
        }
        
        // Also save to vr_app_users table with active=true by default
        VRAppUser vrUser = VRAppUser.builder()
                .email(vrAppUser.getEmail())
                .firstName(vrAppUser.getFirstName())
                .lastName(vrAppUser.getLastName())
                .active(true) // Default to active for new users
                .build();
        
        try {
            vrAppUserRepository.save(vrUser);
        } catch (DataIntegrityViolationException e) {
            // If vr_app_users save fails, we should clean up the users table entry
            userRepository.delete(user);
            throw new IllegalArgumentException("Email already in use: " + vrAppUser.getEmail(), e);
        }
    }

    public int getTotalUsers() {
        return (int) userRepository.count();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public boolean deleteUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return false;
        }
        
        User user = userOpt.get();
        // Don't allow deleting admin users
        if (user.getRole() != null && user.getRole().equalsIgnoreCase("admin")) {
            throw new IllegalArgumentException("Cannot delete admin users");
        }
        
        userRepository.delete(user);
        return true;
    }
}
