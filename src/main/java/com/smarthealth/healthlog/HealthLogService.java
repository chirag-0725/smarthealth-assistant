package com.smarthealth.healthlog;

import com.smarthealth.healthlog.dto.HealthLogRequest;
import com.smarthealth.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class HealthLogService {

    private final HealthLogRepository healthLogRepository;

    public HealthLogService(HealthLogRepository healthLogRepository) {
        this.healthLogRepository = healthLogRepository;
    }

    public HealthLog create(User user, HealthLogRequest request) {
        HealthLog log = HealthLog.builder()
                .userId(user.getId())
                .date(request.getDate())
                .sleepHours(request.getSleepHours())
                .mood(request.getMood())
                .symptoms(request.getSymptoms())
                .notes(request.getNotes())
                .build();
        return healthLogRepository.save(log);
    }

    public Page<HealthLog> findAllForUser(User user, Pageable pageable) {
        return healthLogRepository.findByUserId(user.getId(), pageable);
    }

    public HealthLog findOneForUser(User user, Long logId) {
        return healthLogRepository.findByIdAndUserId(logId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Health log not found"));
    }

    public HealthLog update(User user, Long logId, HealthLogRequest request) {
        HealthLog existing = findOneForUser(user, logId);
        existing.setDate(request.getDate());
        existing.setSleepHours(request.getSleepHours());
        existing.setMood(request.getMood());
        existing.setSymptoms(request.getSymptoms());
        existing.setNotes(request.getNotes());
        return healthLogRepository.save(existing);
    }

    public void delete(User user, Long logId) {
        HealthLog existing = findOneForUser(user, logId);
        healthLogRepository.delete(existing);
    }
}
