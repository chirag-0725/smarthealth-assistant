package com.smarthealth.ai;

import com.smarthealth.ai.dto.AiResponse;
import com.smarthealth.ai.dto.LabReportRequest;
import com.smarthealth.ai.dto.SymptomRequest;
import com.smarthealth.healthlog.HealthLog;
import com.smarthealth.healthlog.HealthLogRepository;
import com.smarthealth.user.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@Tag(name = "AI Assistant", description = "AI-powered symptom checker, weekly summary and lab report explainer (non-diagnostic)")
public class AiController {

    private final AiSymptomService aiSymptomService;
    private final HealthLogRepository healthLogRepository;

    private static final String DISCLAIMER =
            "This is AI-generated general information, not a medical diagnosis. Consult a licensed doctor for medical advice.";

    public AiController(AiSymptomService aiSymptomService, HealthLogRepository healthLogRepository) {
        this.aiSymptomService = aiSymptomService;
        this.healthLogRepository = healthLogRepository;
    }

    @PostMapping("/symptom-check")
    public ResponseEntity<AiResponse> checkSymptoms(@Valid @RequestBody SymptomRequest request) {
        String result = aiSymptomService.checkSymptoms(request.getDescription());
        return ResponseEntity.ok(new AiResponse(result, DISCLAIMER));
    }

    @PostMapping("/weekly-summary")
    public ResponseEntity<AiResponse> weeklySummary(@AuthenticationPrincipal User user) {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(7);

        List<HealthLog> logs = healthLogRepository.findByUserIdAndDateBetween(user.getId(), weekAgo, today);

        if (logs.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "No health logs found in the last 7 days. Add a few entries first.");
        }

        StringBuilder sb = new StringBuilder();
        for (HealthLog log : logs) {
            sb.append(log.getDate()).append(": ");
            if (log.getSleepHours() != null) sb.append(log.getSleepHours()).append("h sleep, ");
            if (log.getMood() != null) sb.append("mood: ").append(log.getMood()).append(", ");
            if (log.getSymptoms() != null && !log.getSymptoms().isBlank()) sb.append("symptoms: ").append(log.getSymptoms()).append(", ");
            if (log.getNotes() != null && !log.getNotes().isBlank()) sb.append("notes: ").append(log.getNotes());
            sb.append("\n");
        }

        String result = aiSymptomService.generateWeeklySummary(sb.toString());
        return ResponseEntity.ok(new AiResponse(result, DISCLAIMER));
    }

    @PostMapping("/lab-report")
    public ResponseEntity<AiResponse> interpretLabReport(@Valid @RequestBody LabReportRequest request) {
        String result = aiSymptomService.interpretLabReport(request.getText());
        return ResponseEntity.ok(new AiResponse(result, DISCLAIMER));
    }
}
