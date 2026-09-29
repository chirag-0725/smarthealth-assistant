package com.smarthealth.medication.dto;

import jakarta.validation.constraints.NotBlank;

public class MedicationRequest {
    @NotBlank(message = "Medication name is required")
    private String name;
    private String dosage;
    private String frequency;
    private Boolean active;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
