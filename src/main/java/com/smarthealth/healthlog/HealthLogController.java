package com.smarthealth.healthlog;

import com.smarthealth.healthlog.dto.HealthLogRequest;
import com.smarthealth.user.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/health-logs")
@Tag(name = "Health Logs", description = "CRUD for daily health entries (sleep, mood, symptoms, notes)")
public class HealthLogController {

    private final HealthLogService healthLogService;

    public HealthLogController(HealthLogService healthLogService) {
        this.healthLogService = healthLogService;
    }

    @PostMapping
    public ResponseEntity<HealthLog> create(@AuthenticationPrincipal User user,
                                             @Valid @RequestBody HealthLogRequest request) {
        return ResponseEntity.ok(healthLogService.create(user, request));
    }

    @GetMapping
    public ResponseEntity<Page<HealthLog>> findAll(@AuthenticationPrincipal User user, Pageable pageable) {
        return ResponseEntity.ok(healthLogService.findAllForUser(user, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HealthLog> findOne(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return ResponseEntity.ok(healthLogService.findOneForUser(user, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HealthLog> update(@AuthenticationPrincipal User user,
                                             @PathVariable Long id,
                                             @Valid @RequestBody HealthLogRequest request) {
        return ResponseEntity.ok(healthLogService.update(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        healthLogService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
