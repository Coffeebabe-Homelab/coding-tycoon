# Backend Specification — Coding Tycoon

> Authoritative technical reference for the backend. Read before any backend work.
> Update this document whenever an API contract or architecture decision changes.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Language | Java 25 |
| Framework | Quarkus 3.x |
| API style | JAX-RS (RESTEasy Reactive) + Jackson |
| ORM | Hibernate ORM with Panache (Active Record) |
| Database | PostgreSQL 16 |
| AI | Quarkus LangChain4j + Ollama — DeepSeek-Coder 6.7B Q4_K_M |
| Auth | Auth0 OIDC (JWT validation via `quarkus-oidc`) |
| Validation | Hibernate Validator (`@Valid`, `@NotNull`, etc.) |
| Health | SmallRye Health (`/q/health`) |
| Tests | JUnit 5, REST Assured, Quarkus Dev Services (Testcontainers) |

---

## Module Structure

```
backend/src/main/java/dev/codingtycoon/
├── task/
│   ├── Task.java                  Entity: title, description, acceptanceCriteria, difficulty, tags, status
│   ├── TaskRepository.java        Panache repository
│   ├── TaskService.java           Business logic, AI task generation call
│   └── TaskResource.java          REST: POST /api/tasks/generate, GET /api/tasks/today
│
├── review/
│   ├── Review.java                Entity: submissionId, verdict, comments (JSON), reviewedAt
│   ├── ReviewRepository.java
│   ├── ReviewService.java         AI review call, verdict processing
│   └── ReviewResource.java        REST: POST /api/reviews/trigger, GET /api/reviews/{id}
│
├── profile/
│   ├── PlayerProfile.java         Entity: userId (Auth0 sub), onboarding settings
│   ├── SkillProfile.java          Entity: strengths, weakPoints, improvementSignals (JSON arrays)
│   ├── ProfileRepository.java
│   ├── ProfileService.java        Create/update profile, trigger skill analysis
│   └── ProfileResource.java       REST: POST /api/profile, GET /api/profile, GET /api/profile/skill
│
├── user/
│   ├── User.java                  Entity: sub (Auth0), email, createdAt
│   ├── UserRepository.java
│   ├── UserService.java           First-login user creation
│   └── UserResource.java          REST: GET /api/me
│
├── vcs/
│   ├── Submission.java            Entity: taskId, userId, code, commitMessage, attemptNumber, submittedAt
│   ├── SubmissionRepository.java
│   ├── VcsService.java            Save submission, compute diff, transition task status
│   └── VcsResource.java           REST: POST /api/submissions, GET /api/submissions/template
│
└── ai/
    ├── TaskGeneratorService.java  @RegisterAiService — generates tasks from player profile
    ├── CodeReviewerService.java   @RegisterAiService — reviews submissions
    └── SkillProfilerService.java  @RegisterAiService — extracts strengths/weak points from reviews
```

---

## REST API Conventions

| Convention | Rule |
|---|---|
| Base path | `/api` |
| Versioning | None for MVP |
| Success format | Plain JSON body |
| Error format | `{ "error": "ErrorType", "message": "Human-readable detail", "status": 400 }` |
| Dates | ISO 8601 UTC strings |
| IDs | `Long` (auto-increment, Panache default) |

### HTTP Status Codes

| Code | When |
|------|------|
| 200 | Successful GET / action |
| 201 | Successful POST that creates a resource (include `Location` header) |
| 400 | Malformed request body |
| 401 | Missing or invalid JWT |
| 403 | Valid JWT but insufficient permissions |
| 404 | Resource not found |
| 422 | Request understood but fails validation |
| 500 | Unexpected server error |

---

## Data Model Overview

```
User
  id         BIGINT PK
  sub        VARCHAR UNIQUE   -- Auth0 sub claim
  email      VARCHAR
  created_at TIMESTAMP

PlayerProfile
  id         BIGINT PK
  user_id    BIGINT FK → User
  language   VARCHAR          -- "Java"
  framework  VARCHAR          -- "Spring Boot"
  seniority  VARCHAR          -- "Junior"
  topics     TEXT[]

Task
  id                BIGINT PK
  player_profile_id BIGINT FK → PlayerProfile
  title             VARCHAR
  description       TEXT
  acceptance_criteria TEXT
  difficulty        VARCHAR
  tags              TEXT[]
  status            VARCHAR    -- ASSIGNED | IN_PROGRESS | SUBMITTED | APPROVED | CHANGES_REQUESTED
  created_at        TIMESTAMP

Submission
  id             BIGINT PK
  task_id        BIGINT FK → Task
  user_id        BIGINT FK → User
  code           TEXT
  commit_message VARCHAR
  attempt_number INT
  submitted_at   TIMESTAMP

Review
  id            BIGINT PK
  submission_id BIGINT FK → Submission
  verdict       VARCHAR   -- APPROVED | CHANGES_REQUESTED
  comments      JSONB     -- [{ file, line, message }]
  reviewed_at   TIMESTAMP

SkillProfile
  id                  BIGINT PK
  user_id             BIGINT FK → User
  strengths           JSONB
  weak_points         JSONB
  improvement_signals JSONB
  updated_at          TIMESTAMP
```

Database migrations: Flyway scripts in `src/main/resources/db/migration/` named `V{n}__{description}.sql`.

---

## AI Integration Pattern

All AI services are defined as interfaces annotated with `@RegisterAiService`. LangChain4j proxies them.

```java
@RegisterAiService
@ApplicationScoped
public interface TaskGeneratorService {
    /**
     * Generates a task appropriate for the given player profile.
     */
    @SystemMessage("You are a senior Java developer creating coding tasks for junior developers...")
    @UserMessage("Generate a task for: language={{language}}, seniority={{seniority}}, topics={{topics}}")
    String generateTask(String language, String seniority, String topics);
}
```

Prompt templates live in `src/main/resources/prompts/` as `.txt` files — referenced by method name convention.

**Testing AI services:** Never call real Ollama in tests. Use `@InjectMock` or a CDI `@Alternative` bean:

```java
@InjectMock
TaskGeneratorService taskGenerator;

// In test setup:
when(taskGenerator.generateTask(any(), any(), any())).thenReturn("Mock task JSON");
```

---

## Authentication & Authorisation

- Auth0 issues JWTs (RS256) with `sub` claim as the user identifier
- Quarkus OIDC fetches the JWKS automatically from `https://{AUTH0_DOMAIN}/.well-known/jwks.json`
- All `/api/*` endpoints (except `/api/health`) require a valid Bearer token
- Use `@Authenticated` on resource classes; `@PermitAll` to explicitly open an endpoint
- Inject the JWT with `@Inject JsonWebToken jwt` — use `jwt.getSubject()` as the user identifier
- CORS is configured for `http://localhost:5173` in dev mode

---

## Error Handling

Exception mappers in `dev.codingtycoon.exception`:

| Exception | HTTP Status |
|---|---|
| `ConstraintViolationException` | 422 |
| `NotFoundException` | 404 |
| `UnauthorizedException` | 401 |
| `RuntimeException` (fallback) | 500 |

All mappers emit the standard error JSON format. Log unexpected errors at `ERROR` level with full stack traces.

---

## Database Migrations

- Tool: Flyway (included via Quarkus extension)
- Location: `src/main/resources/db/migration/`
- Naming: `V{n}__{description}.sql` (e.g. `V1__create_user_table.sql`)
- Dev mode: `quarkus.hibernate-orm.database.generation=drop-and-create` (no migration run)
- Prod mode: `quarkus.hibernate-orm.database.generation=validate` + Flyway runs on startup

---

## Observability

- Structured logging via JBoss LogManager (Quarkus default)
- Log levels: `INFO` globally, `DEBUG` for `dev.codingtycoon.*`
- Health endpoints: `/q/health` (SmallRye aggregated), `/api/health` (custom)
- Log AI requests/responses in dev mode (`quarkus.langchain4j.ollama.log-requests=true`)
- Do not log JWT payloads or user code submissions at `DEBUG` in production
