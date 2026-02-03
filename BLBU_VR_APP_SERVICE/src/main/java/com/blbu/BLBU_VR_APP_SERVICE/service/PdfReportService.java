package com.blbu.BLBU_VR_APP_SERVICE.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.blbu.BLBU_VR_APP_SERVICE.model.VideoCompletion;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;

@Service
public class PdfReportService {

    @Autowired
    private DailyReportService dailyReportService;

    @Autowired
    private Storage storage;

    @Value("${gcs.bucket-name:vr_therapy_videos}")
    private String bucketName;

    @Value("${gcs.reports-folder:reports}")
    private String reportsFolder;

    public String generateAndSaveDailyReport(LocalDate date) throws IOException {
        // Get report data
        Map<String, Object> reportData = dailyReportService.getDailyReport(date);

        // Generate PDF
        byte[] pdfBytes = generatePdf(reportData);

        // Save to GCS
        String filename = String.format("daily-report-%s.pdf", date.format(DateTimeFormatter.ISO_DATE));
        String gcsPath = reportsFolder + "/" + filename;

        BlobId blobId = BlobId.of(bucketName, gcsPath);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType("application/pdf")
                .build();
        storage.create(blobInfo, pdfBytes);

        return filename;
    }

    private byte[] generatePdf(Map<String, Object> reportData) throws IOException {
        PDDocument document = new PDDocument();
        PDPage page = new PDPage();
        document.addPage(page);

        PDPageContentStream contentStream = new PDPageContentStream(document, page);

        float margin = 50;
        float yPosition = 750;
        float lineHeight = 20;
        float tableYStart = yPosition - 100;

        PDType1Font helveticaBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font helvetica = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        // Title
        contentStream.beginText();
        contentStream.setFont(helveticaBold, 20);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText("Daily Video Completion Report");
        contentStream.endText();

        yPosition -= 30;

        // Date
        contentStream.beginText();
        contentStream.setFont(helvetica, 12);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText("Date: " + reportData.get("date"));
        contentStream.endText();

        yPosition -= 20;

        // Summary
        contentStream.beginText();
        contentStream.setFont(helvetica, 12);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText(String.format("Total Completions: %d | Flagged: %d | Active Users: %d",
                reportData.get("totalCompletions"), reportData.get("flaggedCount"), reportData.get("totalUsers")));
        contentStream.endText();

        yPosition = tableYStart;

        // Table Header
        contentStream.setFont(helveticaBold, 10);
        contentStream.beginText();
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText("User");
        contentStream.endText();

        contentStream.beginText();
        contentStream.newLineAtOffset(margin + 150, yPosition);
        contentStream.showText("Video");
        contentStream.endText();

        contentStream.beginText();
        contentStream.newLineAtOffset(margin + 300, yPosition);
        contentStream.showText("Time");
        contentStream.endText();

        contentStream.beginText();
        contentStream.newLineAtOffset(margin + 400, yPosition);
        contentStream.showText("Status");
        contentStream.endText();

        yPosition -= lineHeight;
        contentStream.moveTo(margin, yPosition);
        contentStream.lineTo(550, yPosition);
        contentStream.stroke();

        yPosition -= 10;

        // Table Rows
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> completions = (List<Map<String, Object>>) reportData.get("completions");
        contentStream.setFont(helvetica, 9);

        for (Map<String, Object> completion : completions) {
            if (yPosition < 50) {
                contentStream.close();
                page = new PDPage();
                document.addPage(page);
                contentStream = new PDPageContentStream(document, page);
                yPosition = 750;
            }

            String userName = (String) completion.get("userName");
            String videoTitle = (String) completion.get("videoTitle");
            String completedAt = completion.get("completedAt").toString();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> violations = (List<Map<String, Object>>) completion.get("violations");
            boolean flagged = !violations.isEmpty();

            contentStream.beginText();
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText(userName != null ? userName.substring(0, Math.min(20, userName.length())) : "N/A");
            contentStream.endText();

            contentStream.beginText();
            contentStream.newLineAtOffset(margin + 150, yPosition);
            contentStream.showText(videoTitle != null ? videoTitle.substring(0, Math.min(25, videoTitle.length())) : "N/A");
            contentStream.endText();

            contentStream.beginText();
            contentStream.newLineAtOffset(margin + 300, yPosition);
            contentStream.showText(completedAt.substring(11, 16)); // Just time
            contentStream.endText();

            contentStream.beginText();
            contentStream.newLineAtOffset(margin + 400, yPosition);
            contentStream.showText(flagged ? "FLAGGED" : "OK");
            contentStream.endText();

            if (flagged) {
                yPosition -= 10;
                contentStream.setFont(helvetica, 8);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin + 400, yPosition);
                String violationTypes = violations.stream()
                        .map(v -> (String) v.get("type"))
                        .reduce((a, b) -> a + ", " + b)
                        .orElse("");
                contentStream.showText(violationTypes.substring(0, Math.min(30, violationTypes.length())));
                contentStream.endText();
                contentStream.setFont(helvetica, 9);
            }

            yPosition -= lineHeight;
        }

        contentStream.close();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.save(baos);
        document.close();

        return baos.toByteArray();
    }

    public List<Map<String, Object>> listSavedReports() {
        // List all PDF files in the reports folder
        List<Map<String, Object>> reports = new java.util.ArrayList<>();
        
        try {
            storage.list(bucketName, Storage.BlobListOption.prefix(reportsFolder + "/"))
                    .iterateAll()
                    .forEach(blob -> {
                        Map<String, Object> report = new java.util.HashMap<>();
                        report.put("filename", blob.getName().substring(reportsFolder.length() + 1));
                        report.put("date", extractDateFromFilename(blob.getName()));
                        report.put("createdAt", blob.getUpdateTime() != null ? blob.getUpdateTime() : blob.getCreateTime());
                        reports.add(report);
                    });
        } catch (Exception e) {
            System.err.println("Error listing reports: " + e.getMessage());
        }

        return reports;
    }

    public byte[] downloadReport(String filename) throws IOException {
        String gcsPath = reportsFolder + "/" + filename;
        BlobId blobId = BlobId.of(bucketName, gcsPath);
        byte[] content = storage.readAllBytes(blobId);
        return content;
    }

    private String extractDateFromFilename(String filename) {
        // Extract date from filename like "daily-report-2024-01-15.pdf"
        try {
            String datePart = filename.substring(filename.lastIndexOf("/") + 1)
                    .replace("daily-report-", "")
                    .replace(".pdf", "");
            return datePart;
        } catch (Exception e) {
            return "Unknown";
        }
    }
}

