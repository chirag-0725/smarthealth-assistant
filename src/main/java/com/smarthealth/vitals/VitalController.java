package com.smarthealth.vitals;

import com.smarthealth.user.User;
import com.smarthealth.vitals.dto.VitalRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vitals")
@Tag(name = "Vitals", description = "Blood pressure, heart rate and weight tracking")
public class VitalController {

    private final VitalService vitalService;

    public VitalController(VitalService vitalService) {
        this.vitalService = vitalService;
    }

    @PostMapping
    public ResponseEntity<Vital> create(@AuthenticationPrincipal User user, @Valid @RequestBody VitalRequest request) {
        return ResponseEntity.ok(vitalService.create(user, request));
    }

    @GetMapping
    public ResponseEntity<Page<Vital>> findAll(@AuthenticationPrincipal User user, Pageable pageable) {
        return ResponseEntity.ok(vitalService.findAllForUser(user, pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        vitalService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
