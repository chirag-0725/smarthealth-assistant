package com.smarthealth.vitals;

import com.smarthealth.user.User;
import com.smarthealth.vitals.dto.VitalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VitalService {

    private final VitalRepository vitalRepository;

    public VitalService(VitalRepository vitalRepository) {
        this.vitalRepository = vitalRepository;
    }

    public Vital create(User user, VitalRequest request) {
        Vital vital = new Vital();
        vital.setUserId(user.getId());
        vital.setDate(request.getDate());
        vital.setSystolic(request.getSystolic());
        vital.setDiastolic(request.getDiastolic());
        vital.setHeartRate(request.getHeartRate());
        vital.setWeightKg(request.getWeightKg());
        vital.setNotes(request.getNotes());
        return vitalRepository.save(vital);
    }

    public Page<Vital> findAllForUser(User user, Pageable pageable) {
        return vitalRepository.findByUserId(user.getId(), pageable);
    }

    public void delete(User user, Long id) {
        Vital vital = vitalRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vital entry not found"));
        vitalRepository.delete(vital);
    }
}
