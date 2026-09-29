package com.smarthealth.medication;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MedicationRepository extends JpaRepository<Medication, Long> {
    List<Medication> findByUserIdOrderByActiveDescNameAsc(Long userId);
    Optional<Medication> findByIdAndUserId(Long id, Long userId);
}
