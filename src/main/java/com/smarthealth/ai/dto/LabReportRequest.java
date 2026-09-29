package com.smarthealth.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class LabReportRequest {
    @NotBlank(message = "Please paste the report text")
    private String text;

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
