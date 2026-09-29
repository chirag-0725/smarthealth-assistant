package com.smarthealth.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class AiSymptomService {

    private static final Logger log = LoggerFactory.getLogger(AiSymptomService.class);

    private final WebClient webClient;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    @Value("${openai.model}")
    private String model;

    private static final String SYMPTOM_SYSTEM_PROMPT = """
            You are a health information assistant. You are NOT a doctor and must never provide a diagnosis.
            Given a description of symptoms, respond with:
            1. Two or three possible general, non-diagnostic explanations
            2. Simple, safe self-care tips where appropriate
            3. A clear statement of when the person should see a doctor or seek urgent/emergency care
            Keep the response under 180 words. Always include a brief reminder that this is not medical advice.
            If the symptoms described sound like a medical emergency (e.g. chest pain, difficulty breathing,
            signs of stroke, severe bleeding, loss of consciousness), begin your ENTIRE response with the exact
            text "URGENT:" (followed by a space) before anything else, then explain why and tell them to seek
            emergency care immediately. Only use the "URGENT:" prefix for genuine emergencies, not routine symptoms.
            """;

    private static final String WEEKLY_SUMMARY_SYSTEM_PROMPT = """
            You are a health information assistant. You are NOT a doctor and must never provide a diagnosis.
            You will be given a list of a person's daily health log entries from the past week (date, sleep hours,
            mood, symptoms, notes). Write a short, plain-language summary (under 200 words) that:
            1. Notices any patterns across the week (e.g. sleep trends, recurring symptoms, mood changes)
            2. Gently highlights anything that might be worth mentioning to a doctor, without diagnosing
            3. Ends with a brief, encouraging note
            If there isn't enough data to say anything meaningful, say so plainly rather than guessing.
            Always remind the reader this is general information, not medical advice.
            """;

    private static final String LAB_REPORT_SYSTEM_PROMPT = """
            You are a health information assistant. You are NOT a doctor and must never provide a diagnosis.
            The user will paste text from a lab report or test result. Explain, in plain everyday language,
            what the values or terms generally mean and why a doctor might check them. Do not state whether
            specific values are normal or abnormal for this person, since you don't have their full medical
            context or reference ranges used by their lab. Encourage them to review the results with their
            doctor for interpretation specific to them. Keep the response under 220 words.
            """;

    public AiSymptomService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public String checkSymptoms(String symptomDescription) {
        return callChat(SYMPTOM_SYSTEM_PROMPT, symptomDescription, 300);
    }

    public String generateWeeklySummary(String weeklyLogText) {
        return callChat(WEEKLY_SUMMARY_SYSTEM_PROMPT, weeklyLogText, 350);
    }

    public String interpretLabReport(String reportText) {
        return callChat(LAB_REPORT_SYSTEM_PROMPT, reportText, 350);
    }

    @SuppressWarnings("unchecked")
    private String callChat(String systemPrompt, String userMessage, int maxTokens) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("REPLACE_WITH")) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI service is not configured. Set openai.api.key in application.properties.");
        }

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                ),
                "temperature", 0.4,
                "max_tokens", maxTokens
        );

        try {
            Map<String, Object> response = webClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(25))
                    .block();

            if (response == null || !response.containsKey("choices")) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI service returned an unexpected response");
            }

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> firstChoice = choices.get(0);
            Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
            return (String) message.get("content");

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("AI request failed", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to reach AI service. Please try again shortly.");
        }
    }
}
