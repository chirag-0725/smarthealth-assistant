package com.smarthealth.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class SymptomRequest {

    @NotBlank(message = "Please describe your symptoms")
    private String description;

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
