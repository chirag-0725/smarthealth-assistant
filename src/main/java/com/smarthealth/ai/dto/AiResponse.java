package com.smarthealth.ai.dto;

public class AiResponse {
    private String result;
    private String disclaimer;

    public AiResponse() {
    }

    public AiResponse(String result, String disclaimer) {
        this.result = result;
        this.disclaimer = disclaimer;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String result;
        private String disclaimer;

        public Builder result(String result) {
            this.result = result;
            return this;
        }

        public Builder disclaimer(String disclaimer) {
            this.disclaimer = disclaimer;
            return this;
        }

        public AiResponse build() {
            return new AiResponse(result, disclaimer);
        }
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }
}
