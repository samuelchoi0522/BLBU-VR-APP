package com.blbu.BLBU_VR_APP_SERVICE.config;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.blbu.BLBU_VR_APP_SERVICE.service.PdfReportService;

@Component
public class ScheduledTasks {

    @Autowired
    private PdfReportService pdfReportService;

    // Run at 11:59 PM every day
    @Scheduled(cron = "0 59 23 * * ?")
    public void generateDailyReport() {
        try {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            System.out.println("Generating daily report for: " + yesterday);
            String filename = pdfReportService.generateAndSaveDailyReport(yesterday);
            System.out.println("Daily report generated successfully: " + filename);
        } catch (Exception e) {
            System.err.println("Failed to generate daily report: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

