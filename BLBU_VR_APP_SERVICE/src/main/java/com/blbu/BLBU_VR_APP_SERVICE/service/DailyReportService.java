package com.blbu.BLBU_VR_APP_SERVICE.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoCompletion;
import com.blbu.BLBU_VR_APP_SERVICE.model.VideoWatchEvent;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoCompletionRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VideoWatchEventRepository;
import com.blbu.BLBU_VR_APP_SERVICE.repository.VRAppUserRepository;

@Service
public class DailyReportService {

    @Autowired
    private VideoCompletionRepository completionRepository;

    @Autowired
    private VideoWatchEventRepository watchEventRepository;

    @Autowired
    private VRAppUserRepository vrAppUserRepository;

    public Map<String, Object> getDailyReport(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        // Get all completions for the date
        List<VideoCompletion> completions = completionRepository.findAllByDateRange(startOfDay, endOfDay);

        // Get all violations for the date
        List<VideoWatchEvent> allEvents = watchEventRepository.findByTimestampAfterOrderByTimestampDesc(startOfDay);
        List<VideoWatchEvent> violations = allEvents.stream()
                .filter(e -> e.getTimestamp().isBefore(endOfDay) && 
                        (e.getEventType().toString().equals("VIOLATION") || 
                         e.getEventType().toString().equals("SEEK_ATTEMPT")))
                .collect(Collectors.toList());

        // Group violations by email and video (for future use if needed)

        // Build completion data with violations
        List<Map<String, Object>> completionData = new ArrayList<>();
        int flaggedCount = 0;

        for (VideoCompletion completion : completions) {
            String email = completion.getEmail();
            Long videoId = completion.getVideo().getId();

            // Find violations for this user and video
            List<VideoWatchEvent> userViolations = violations.stream()
                    .filter(v -> v.getEmail().equals(email) && 
                            v.getVideo() != null && v.getVideo().getId().equals(videoId))
                    .collect(Collectors.toList());

            // Get user info
            String userName = vrAppUserRepository.findByEmail(email)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse(email);

            Map<String, Object> completionInfo = new HashMap<>();
            completionInfo.put("email", email);
            completionInfo.put("userName", userName);
            completionInfo.put("videoTitle", completion.getVideo().getTitle());
            completionInfo.put("completedAt", completion.getCompletedAt());
            completionInfo.put("flagged", !userViolations.isEmpty());
            completionInfo.put("violations", userViolations.stream()
                    .map(v -> {
                        Map<String, Object> violation = new HashMap<>();
                        violation.put("type", v.getEventType().toString());
                        violation.put("timestamp", v.getTimestamp());
                        violation.put("details", v.getDetails());
                        return violation;
                    })
                    .collect(Collectors.toList()));

            if (!userViolations.isEmpty()) {
                flaggedCount++;
            }

            completionData.add(completionInfo);
        }

        // Get total active users
        long totalUsers = vrAppUserRepository.findByActiveTrue().size();

        Map<String, Object> report = new HashMap<>();
        report.put("date", date.toString());
        report.put("totalCompletions", completions.size());
        report.put("flaggedCount", flaggedCount);
        report.put("totalUsers", totalUsers);
        report.put("completions", completionData);

        return report;
    }
}

