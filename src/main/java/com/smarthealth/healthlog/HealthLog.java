package com.smarthealth.healthlog;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "health_logs")
public class HealthLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate date;

    private Integer sleepHours;

    private String mood;

    @Column(length = 1000)
    private String symptoms;

    @Column(length = 2000)
    private String notes;

    public HealthLog() {
    }

    public HealthLog(Long id, Long userId, LocalDate date, Integer sleepHours, String mood, String symptoms, String notes) {
        this.id = id;
        this.userId = userId;
        this.date = date;
        this.sleepHours = sleepHours;
        this.mood = mood;
        this.symptoms = symptoms;
        this.notes = notes;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Long userId;
        private LocalDate date;
        private Integer sleepHours;
        private String mood;
        private String symptoms;
        private String notes;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Builder date(LocalDate date) {
            this.date = date;
            return this;
        }

        public Builder sleepHours(Integer sleepHours) {
            this.sleepHours = sleepHours;
            return this;
        }

        public Builder mood(String mood) {
            this.mood = mood;
            return this;
        }

        public Builder symptoms(String symptoms) {
            this.symptoms = symptoms;
            return this;
        }

        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public HealthLog build() {
            return new HealthLog(id, userId, date, sleepHours, mood, symptoms, notes);
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Integer getSleepHours() {
        return sleepHours;
    }

    public void setSleepHours(Integer sleepHours) {
        this.sleepHours = sleepHours;
    }

    public String getMood() {
        return mood;
    }

    public void setMood(String mood) {
        this.mood = mood;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
