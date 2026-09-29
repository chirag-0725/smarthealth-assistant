package com.smarthealth.vitals.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class VitalRequest {
    @NotNull(message = "Date is required")
    private LocalDate date;
    private Integer systolic;
    private Integer diastolic;
    private Integer heartRate;
    private Double weightKg;
    private String notes;

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public Integer getSystolic() { return systolic; }
    public void setSystolic(Integer systolic) { this.systolic = systolic; }
    public Integer getDiastolic() { return diastolic; }
    public void setDiastolic(Integer diastolic) { this.diastolic = diastolic; }
    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }
    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
