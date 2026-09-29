package com.smarthealth.vitals;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VitalRepository extends JpaRepository<Vital, Long> {
    Page<Vital> findByUserId(Long userId, Pageable pageable);
    Optional<Vital> findByIdAndUserId(Long id, Long userId);
}
