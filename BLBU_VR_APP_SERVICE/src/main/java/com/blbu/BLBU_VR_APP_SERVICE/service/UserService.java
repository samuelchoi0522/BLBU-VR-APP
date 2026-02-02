package com.blbu.BLBU_VR_APP_SERVICE.service;

import com.blbu.BLBU_VR_APP_SERVICE.model.User;
import com.blbu.BLBU_VR_APP_SERVICE.model.VRAppUser;
import com.blbu.BLBU_VR_APP_SERVICE.repository.UserRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VRAppUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public boolean validateUserCredentials(String email, String rawPassword) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isPresent()) {
            return passwordEncoder.matches(rawPassword, optionalUser.get().getPassword());
        }
        return false;
    }

    public void registerVRAppUser(VRAppUser vrAppUser) {
        // Save to main users table with role "user" instead of separate vr_app_users table
        User user = new User();
        user.setEmail(vrAppUser.getEmail());
        user.setPassword(passwordEncoder.encode(vrAppUser.getPassword()));
        user.setRole("user");
        userRepository.save(user);
    }

    public int getTotalUsers() {
        return (int) userRepository.count();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
