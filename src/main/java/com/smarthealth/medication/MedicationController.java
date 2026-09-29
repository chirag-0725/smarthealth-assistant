package com.smarthealth.medication;

import com.smarthealth.medication.dto.MedicationRequest;
import com.smarthealth.user.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/medications")
@Tag(name = "Medications", description = "Basic medication list and reminders")
public class MedicationController {

    private final MedicationService medicationService;

    public MedicationController(MedicationService medicationService) {
        this.medicationService = medicationService;
    }

    @PostMapping
    public ResponseEntity<Medication> create(@AuthenticationPrincipal User user, @Valid @RequestBody MedicationRequest request) {
        return ResponseEntity.ok(medicationService.create(user, request));
    }

    @GetMapping
    public ResponseEntity<List<Medication>> findAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(medicationService.findAllForUser(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medication> update(@AuthenticationPrincipal User user, @PathVariable Long id, @Valid @RequestBody MedicationRequest request) {
        return ResponseEntity.ok(medicationService.update(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        medicationService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
