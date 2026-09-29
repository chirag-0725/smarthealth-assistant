package com.smarthealth.medication;

import com.smarthealth.medication.dto.MedicationRequest;
import com.smarthealth.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class MedicationService {

    private final MedicationRepository medicationRepository;

    public MedicationService(MedicationRepository medicationRepository) {
        this.medicationRepository = medicationRepository;
    }

    public Medication create(User user, MedicationRequest request) {
        Medication med = new Medication();
        med.setUserId(user.getId());
        med.setName(request.getName());
        med.setDosage(request.getDosage());
        med.setFrequency(request.getFrequency());
        med.setActive(request.getActive() == null || request.getActive());
        return medicationRepository.save(med);
    }

    public List<Medication> findAllForUser(User user) {
        return medicationRepository.findByUserIdOrderByActiveDescNameAsc(user.getId());
    }

    public Medication update(User user, Long id, MedicationRequest request) {
        Medication med = findOwned(user, id);
        med.setName(request.getName());
        med.setDosage(request.getDosage());
        med.setFrequency(request.getFrequency());
        if (request.getActive() != null) med.setActive(request.getActive());
        return medicationRepository.save(med);
    }

    public void delete(User user, Long id) {
        medicationRepository.delete(findOwned(user, id));
    }

    private Medication findOwned(User user, Long id) {
        return medicationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medication not found"));
    }
}
