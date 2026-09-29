# SmartHealth Assistant

An AI-powered personal health tracker built with **Spring Boot 3**, **Spring Security + JWT**, and a free LLM API (Groq, OpenAI-compatible). It ships with a full web dashboard — not just a backend API — so you can register, log in, and use the whole thing from a browser.

## Features

- **Web dashboard** — login, register, and a full UI (no Swagger needed for normal use)
- **JWT authentication** — access + refresh tokens, BCrypt password hashing, role-based access (`USER`, `ADMIN`)
- **Health Logs** — daily entries for sleep, mood, symptoms and notes, shown as a timeline
- **Vitals tracker** — blood pressure, heart rate, and weight over time
- **Medications** — a simple list with dosage/frequency and an active/inactive toggle
- **Trends** — line charts of sleep and mood across your recent entries (Chart.js)
- **AI Symptom Checker** — calls an OpenAI-compatible chat completions API (works free with **Groq**, or with OpenAI), with a safety-guarded prompt that never diagnoses and flags a red "urgent" banner if it detects a possible emergency
- **Weekly AI summary** — one click generates a plain-language summary of patterns across your last 7 days of logs
- **Lab report explainer** — paste text from a lab result and get a plain-language explanation of the terms
- **Profile page** — update your name/email and change your password
- **PDF export** — download your health log as a PDF to bring to a doctor's visit
- **Swagger / OpenAPI docs** with a built-in "Authorize" button, for testing the raw API directly
- Runs out of the box on an **in-memory H2 database** — no DB install needed to try it today
- `Dockerfile` + `docker-compose` for a Postgres-backed, production-style setup

## Requirements

- Java 17+
- Maven 3.9+ (or an IDE like IntelliJ that bundles Maven)
- A free Groq API key for the AI features — get one at https://console.groq.com/keys (no credit card required). OpenAI is also supported if you'd rather use that instead (see comments in `application.properties`).

## Run it — fastest path (H2, no DB setup)

1. Clone or unzip the project and open a terminal in the project root.
2. Open `src/main/resources/application.properties` and set your AI key:
   ```properties
   openai.api.key=gsk_...your-groq-key...
   ```
   (You can skip this and everything else will still work — only the AI features will return a 503 until you add a key.)
3. Change `jwt.secret` to any long random string (32+ characters) — the placeholder works for local testing but should never be used in production.
4. Run:
   ```bash
   mvn spring-boot:run
   ```
5. The app starts on **http://localhost:8080**.
6. Open the app itself: **http://localhost:8080** — this takes you to the login page, then the dashboard once you register/log in.
7. Open Swagger UI (for testing the raw API): **http://localhost:8080/swagger-ui/index.html**
8. (Optional) H2 console to inspect the in-memory DB: **http://localhost:8080/h2-console** — JDBC URL `jdbc:h2:mem:smarthealth`, user `sa`, blank password.

> Note: the H2 database is in-memory, so all data (accounts, logs, vitals, etc.) resets every time the app restarts.

## Run it with real PostgreSQL (via Docker)

```bash
export OPENAI_API_KEY=gsk_...your-groq-key...
docker-compose up --build
```
This spins up the app + a Postgres container together, on **http://localhost:8080**.

To use Postgres without Docker: in `application.properties`, comment out the H2 block and uncomment the PostgreSQL block, fill in your local DB credentials, then `mvn spring-boot:run`.

## Using the app

Once running, open **http://localhost:8080** in your browser:

1. **Register** a new account
2. You'll land on the **dashboard**, with these sections in the sidebar:
   - **Health Logs** — add/view/delete daily entries, export them as a PDF
   - **Vitals** — log blood pressure, heart rate, weight
   - **Medications** — track what you're taking
   - **Trends** — see charts of your sleep and mood over time
   - **AI Assistant** — describe symptoms and get general, non-diagnostic guidance; generate a weekly summary
   - **Lab Reports** — paste text from a lab result for a plain-language explanation
   - **Profile** — update your name/email or change your password

## API testing via Swagger (optional)

Everything above is also available as a raw REST API, documented at `/swagger-ui/index.html`. Click "Authorize," paste your access token (no "Bearer" prefix needed — Swagger adds that automatically), and call any endpoint directly. Useful example requests:

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"password123"}'

# Create a health log (use the accessToken from above)
curl -X POST http://localhost:8080/api/health-logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"date":"2026-09-23","sleepHours":6,"mood":"tired","symptoms":"mild headache","notes":"long day at work"}'

# AI symptom check
curl -X POST http://localhost:8080/api/ai/symptom-check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"description":"I have had a mild headache and feel tired for the past two days"}'
```

## Running tests

```bash
mvn test
```

## Project structure

```
src/main/java/com/smarthealth/
├── auth/           # register/login/refresh controller, service, DTOs
├── security/       # JwtService, JwtAuthFilter, SecurityConfig, ApplicationConfig
├── user/           # User entity (implements UserDetails), Role, repository
├── healthlog/      # Health log entity, repository, service, controller, DTOs
├── vitals/         # Blood pressure / heart rate / weight tracking
├── medication/     # Medication list, active/inactive tracking
├── profile/        # View/update account details, change password
├── ai/             # AI symptom checker, weekly summary, lab report explainer
├── config/         # Swagger/OpenAPI config
└── exception/      # Global exception handler

src/main/resources/
├── application.properties
└── static/         # The web dashboard: login, register, dashboard (HTML/CSS/JS)
```

## Roadmap / stretch features (not yet built — good "future work" talking points)

- Scheduled, automatic weekly AI insight emails (currently the weekly summary is generated on-demand by clicking a button, not sent automatically)
- AI meal analyzer (nutrition estimate from a text/photo description)
- Async processing of AI calls via RabbitMQ/Kafka so requests don't block on LLM latency
- Rate limiting on AI endpoints (Bucket4j) to control API cost
- Redis caching for frequently accessed insights
- Doctor/caregiver role with shareable read-only access to a patient's logs
- Push/SMS medication reminders (currently shown in-app only, not sent externally)

## Notes on the AI feature

The symptom checker and weekly summary are intentionally **non-diagnostic**: the system prompts instruct the model to give general possibilities, self-care tips, and clear guidance on when to see a doctor — never a diagnosis. The symptom checker also prefixes its response with "URGENT:" when it detects language suggesting a possible medical emergency, which the frontend turns into a red warning banner. This is a deliberate safety design choice worth mentioning in an interview.
