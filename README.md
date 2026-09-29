# SmartHealth Assistant

An AI-powered personal health tracker backend built with **Spring Boot 3**, **Spring Security + JWT**, and the **OpenAI API**. Users register, log in with JWT auth, track daily health logs, and get AI-generated (non-diagnostic) symptom insights.

## Features
- A web dashboard (login, register, health log timeline, AI chat) — no Swagger needed for normal use
- JWT authentication (access + refresh tokens), BCrypt password hashing
- Role-based access (`USER`, `ADMIN`)
- Health log CRUD (sleep, mood, symptoms, notes) — scoped per authenticated user
- AI Symptom Checker powered by an OpenAI-compatible chat completions API (works with Groq for free, or OpenAI), with a safety-guarded system prompt (never diagnoses, always flags emergencies and recommends seeing a doctor)
- Swagger / OpenAPI docs with a built-in "Authorize" button for testing JWT-protected endpoints directly
- Runs out of the box on an in-memory H2 database — no DB install needed to try it today
- Dockerfile + docker-compose for a Postgres-backed production-style setup

## Requirements
- Java 17+
- Maven 3.9+ (or use an IDE like IntelliJ that bundles Maven)
- An OpenAI API key (only needed for the `/api/ai/symptom-check` endpoint) — get one at https://platform.openai.com/api-keys

## Run it — fastest path (H2, no DB setup)

1. Unzip the project and open a terminal in the project root.
2. Open `src/main/resources/application.properties` and set your OpenAI key:
   ```properties
   openai.api.key=sk-...your-key...
   ```
   (You can skip this and everything else will still work — only the AI endpoint will return a 503 until you add a key.)
3. Also change `jwt.secret` to any long random string (32+ characters) — the placeholder is fine for local testing but never use it in production.
4. Run:
   ```bash
   mvn spring-boot:run
   ```
5. The app starts on **http://localhost:8080**.
6. Open the app itself: **http://localhost:8080** — this takes you to the login page, then the dashboard (health logs + AI chat) once you register/log in.
7. Open Swagger UI (for testing the raw API): **http://localhost:8080/swagger-ui/index.html**
8. (Optional) H2 console to inspect the in-memory DB: **http://localhost:8080/h2-console** — JDBC URL `jdbc:h2:mem:smarthealth`, user `sa`, blank password.

## Run it with real PostgreSQL (via Docker)

```bash
export OPENAI_API_KEY=sk-...your-key...
docker-compose up --build
```
This spins up the app + a Postgres container together. The app will be on `http://localhost:8080`.

To use Postgres **without** Docker, edit `application.properties`: comment out the H2 block and uncomment the PostgreSQL block, fill in your local DB credentials, then `mvn spring-boot:run`.

## Try it — example requests

**1. Register**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"password123"}'
```
Response includes `accessToken` and `refreshToken`.

**2. Login**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"password123"}'
```

**3. Create a health log** (use the `accessToken` from above)
```bash
curl -X POST http://localhost:8080/api/health-logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"date":"2026-09-23","sleepHours":6,"mood":"tired","symptoms":"mild headache","notes":"long day at work"}'
```

**4. List your health logs**
```bash
curl http://localhost:8080/api/health-logs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**5. AI symptom check**
```bash
curl -X POST http://localhost:8080/api/ai/symptom-check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"description":"I have had a mild headache and feel tired for the past two days"}'
```

**6. Refresh an expired access token**
```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

Or just do all of this from the **Swagger UI**: click "Authorize", paste `Bearer YOUR_ACCESS_TOKEN`, and call any endpoint from the browser.

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
├── ai/             # AI symptom checker service + controller, DTOs
├── config/         # Swagger/OpenAPI config
└── exception/      # Global exception handler
```

## Roadmap / stretch features (not yet built — good "future work" talking points)
- Scheduled weekly AI insight generator (`@Scheduled` job that summarizes a user's week)
- AI meal analyzer (nutrition estimate from a text/photo description)
- Async processing of AI calls via RabbitMQ/Kafka so requests don't block on LLM latency
- Rate limiting on AI endpoints (Bucket4j) to control API cost
- Redis caching for frequently accessed insights
- Doctor role with shareable read-only access to a patient's logs

## Notes on the AI feature
The symptom checker is intentionally **non-diagnostic**: the system prompt instructs the model to give general possibilities, self-care tips, and clear guidance on when to see a doctor or seek emergency care — never a diagnosis. This is a deliberate safety design choice worth mentioning in an interview.
