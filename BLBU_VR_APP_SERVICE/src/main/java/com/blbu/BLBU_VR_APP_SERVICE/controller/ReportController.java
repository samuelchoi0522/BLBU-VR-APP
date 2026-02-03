package com.blbu.BLBU_VR_APP_SERVICE.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blbu.BLBU_VR_APP_SERVICE.service.DailyReportService;
import com.blbu.BLBU_VR_APP_SERVICE.service.PdfReportService;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final DailyReportService dailyReportService;
    private final PdfReportService pdfReportService;

    public ReportController(DailyReportService dailyReportService, PdfReportService pdfReportService) {
        this.dailyReportService = dailyReportService;
        this.pdfReportService = pdfReportService;
    }

    @GetMapping("/daily")
    public ResponseEntity<?> getDailyReport(@RequestParam String date) {
        try {
            LocalDate reportDate = LocalDate.parse(date, DateTimeFormatter.ISO_DATE);
            Map<String, Object> report = dailyReportService.getDailyReport(reportDate);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate report: " + e.getMessage()));
        }
    }

    @GetMapping("/list")
    public ResponseEntity<?> listSavedReports() {
        try {
            List<Map<String, Object>> reports = pdfReportService.listSavedReports();
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to list reports: " + e.getMessage()));
        }
    }

    @GetMapping("/download")
    public ResponseEntity<?> downloadReport(@RequestParam String filename) {
        try {
            byte[] pdfBytes = pdfReportService.downloadReport(filename);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Report not found: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to download report: " + e.getMessage()));
        }
    }
}

