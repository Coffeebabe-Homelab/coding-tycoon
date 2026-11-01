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
| AI | Quarkus LangChain4j + Ollama with DeepSeek-Coder 6.7B Q4_K_M (planned; currently `StubTaskAdapter` with seed fallback, see ROADMAP P0-03) |
| Observability | Quarkus OpenTelemetry: OTLP logs, traces and metrics to LGTM (`observability/README.md`) |
| Auth | Auth0 OIDC (JWT validation via `quarkus-oidc`) |
| Validation | Hibernate Validator (`@Valid`, `@NotNull`, etc.) |
| Health | SmallRye Health (`/q/health`) |
| Tests | JUnit 5, REST Assured, Quarkus Dev Services (Testcontainers) |

---

## Architecture

The backend uses **DDD-style package structure** combined with **light Hexagonal Architecture** at external boundaries (AI and persistence).

Dependency direction: `Resource → Service → Port interface ← Adapter (Ollama / Panache)`

- **Resources** are HTTP adapters (in). They parse requests and build responses. No business logic.
- **Services** are the domain core. They only depend on port interfaces and domain classes — never on LangChain4j or Panache directly.
- **Ports** are interfaces the service defines for what it needs (`ReviewAiPort`, `TaskRepository`).
- **Adapters** implement ports using real infrastructure (`OllamaReviewAdapter`, `JpaTaskRepository`).

This keeps services independently testable — swap the adapter for a mock and the service never knows.

## Module Structure

```
backend/src/main/java/dev/codingtycoon/
├── task/
│   ├── Task.java                    Entity: title, description, acceptanceCriteria, difficulty, tags, status
│   ├── TaskRepository.java          Port (interface) — persistence boundary
│   ├── JpaTaskRepository.java       Adapter — Panache implementation
│   ├── TaskAiPort.java              Port (interface) — AI boundary
│   ├── StubTaskAdapter.java         Adapter (current): returns empty, so TaskService uses seed tasks
│   ├── OllamaTaskAdapter.java       Adapter (planned): LangChain4j implementation
│   ├── TaskService.java             Domain core: business logic, orchestration
│   └── TaskResource.java            Adapter (HTTP in): POST /api/tasks/generate, GET /api/tasks/today
│
├── review/
│   ├── Review.java                  Entity: submissionId, verdict, comments (JSON), reviewedAt
│   ├── ReviewRepository.java        Port (interface)
│   ├── JpaReviewRepository.java     Adapter — Panache
│   ├── ReviewAiPort.java            Port (interface) — AI boundary (key isolation point)
│   ├── OllamaReviewAdapter.java     Adapter — LangChain4j
│   ├── ReviewService.java           Domain core
│   └── ReviewResource.java          Adapter (HTTP in): POST /api/reviews/trigger, GET /api/reviews/{id}
│
├── profile/
│   ├── PlayerProfile.java           Entity: userId (Auth0 sub), onboarding settings
│   ├── SkillProfile.java            Entity: strengths, weakPoints, improvementSignals (JSON arrays)
│   ├── ProfileRepository.java       Port (interface)
│   ├── JpaProfileRepository.java    Adapter — Panache
│   ├── SkillAiPort.java             Port (interface) — AI boundary
│   ├── OllamaSkillAdapter.java      Adapter — LangChain4j
│   ├── ProfileService.java          Domain core
│   └── ProfileResource.java         Adapter (HTTP in): POST /api/profile, GET /api/profile, GET /api/profile/skill
│
├── user/
│   ├── User.java                    Entity: sub (Auth0), email, createdAt
│   ├── UserRepository.java          Port (interface)
│   ├── JpaUserRepository.java       Adapter — Panache
│   ├── UserService.java             Domain core
│   └── UserResource.java            Adapter (HTTP in): GET /api/me
│
├── vcs/
│   ├── Submission.java              Entity: taskId, userId, code, commitMessage, attemptNumber, submittedAt
│   ├── SubmissionRepository.java    Port (interface)
│   ├── JpaSubmissionRepository.java Adapter — Panache
│   ├── VcsService.java              Domain core
│   └── VcsResource.java             Adapter (HTTP in): POST /api/submissions, GET /api/submissions/template
│
├── codebase/                        (Phase 3)
│   ├── CodebaseRepository.java      Port (interface): list files / read file for a codebase key
│   ├── ClasspathCodebaseRepository.java  Adapter: static files under resources/codebases/<key>/
│   ├── CodebaseService.java         Domain core: resolves the player's active task to its codebase; index allow-list
│   ├── CodebaseFilesResponse.java   Response: { codebase, focusFiles, files }
│   ├── CodebaseFileResponse.java    Response: { path, content }
│   └── CodebaseResource.java        Adapter (HTTP in): GET /api/codebase/files, GET /api/codebase/files/{path}
│
├── progress/                        (Phase 7)
│   ├── XpEvent.java                 Entity: ledger row (playerProfileId, taskId, amount, reason, createdAt UTC)
│   ├── XpReason.java                Enum: TASK_APPROVED (FIRST_ATTEMPT_BONUS arrives with Phase 5)
│   ├── XpEventRepository.java       Port (interface)
│   ├── JpaXpEventRepository.java    Adapter — Panache
│   ├── StreakCalculator.java        Pure date logic: current/longest run of active days, `today` passed in
│   ├── Streak.java                  Value: current, longest
│   ├── ProgressService.java         Domain core: awards XP on approval (called by TaskService), computes totals and streak
│   ├── ProgressResponse.java        JSON: totalXp, xpToday, currentStreak, longestStreak, approvedTodayTaskTitle
│   └── ProgressResource.java        Adapter (HTTP in): GET /api/progress
│
└── ai/
    └── (shared prompt string constants — no business logic)
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

### Progress API

`GET /api/progress` (authenticated) → `200`

```json
{ "totalXp": 300, "xpToday": 100, "currentStreak": 2, "longestStreak": 3, "approvedTodayTaskTitle": "Add a REST endpoint" }
```

- XP: `100` per approved task (`ProgressService.XP_PER_APPROVED_TASK`), awarded once per task when `TaskService` moves it to `APPROVED`. The first-attempt bonus (`+50`) is added in Phase 5.
- A "day" is a UTC calendar day. `xpToday` sums today's events.
- Streak: consecutive days with at least one `TASK_APPROVED` event. `currentStreak` counts a run ending today or yesterday (so it isn't lost before today's work), otherwise `0`.
- `approvedTodayTaskTitle`: the latest task approved today, or `null`. `GET /api/tasks/today` only returns non-approved tasks, so the End of Day screen reads it from here.
- `401` without a token, `404` if the player has no profile.

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

### Codebase API (Phase 3)

Read-only. Both endpoints require a Bearer token and resolve the codebase from the player's active (non-`APPROVED`) task. Any other HTTP method returns `405`.

| Method | Path | Response | Errors |
|---|---|---|---|
| GET | `/api/codebase/files` | `{ "codebase": "shopfront", "focusFiles": ["src/..."], "files": ["README.md", ...] }` (flat, sorted) | 401; 404 no active task / unknown codebase |
| GET | `/api/codebase/files/{path: .+}` | `{ "path": "...", "content": "..." }` (UTF-8 text) | 401; 404 path not in `index.txt` (includes `../`, absolute and URL-encoded traversal) |

Codebases live in `src/main/resources/codebases/<key>/` with an `index.txt` listing every file (one relative path per line, sorted). The index is the allow-list: only listed paths are ever read, and `CodebaseIndexTest` keeps it in sync with the files. Task responses (`/api/tasks/*`) include `codebaseKey` and `focusFiles`.

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
  user_id    BIGINT FK → User  UNIQUE
  language   VARCHAR          -- "Java"
  framework  VARCHAR          -- "Spring Boot"
  seniority  VARCHAR          -- "Junior"
  -- topics stored via join table (see below)

Topic
  id   BIGINT PK
  name VARCHAR UNIQUE         -- "REST APIs", "CRUD", "OOP", "Clean Code", "Git Workflow"
  slug VARCHAR UNIQUE         -- "rest-apis", "crud", "oop", "clean-code", "git-workflow"

PlayerProfileTopic             -- join table (many-to-many)
  profile_id BIGINT FK → PlayerProfile
  topic_id   BIGINT FK → Topic
  PRIMARY KEY (profile_id, topic_id)

Task
  id                BIGINT PK
  player_profile_id BIGINT FK → PlayerProfile
  title             VARCHAR
  description       TEXT
  acceptance_criteria TEXT
  difficulty        VARCHAR
  tags              TEXT[]
  codebase_key      VARCHAR    -- default 'shopfront' (V7)
  focus_files       TEXT       -- comma-separated codebase paths, default '' (V7)
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

XpEvent                        -- table xp_event; ledger, one row per award
  id                BIGINT PK
  player_profile_id BIGINT FK → PlayerProfile
  task_id           BIGINT FK → Task
  amount            INT
  reason            VARCHAR    -- TASK_APPROVED
  created_at        TIMESTAMP  -- UTC
  UNIQUE (task_id, reason)     -- makes awarding idempotent

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

AI services are accessed through **port interfaces** defined in each domain package. This decouples the service from LangChain4j so you can mock the AI in tests and swap providers (e.g. Ollama → OpenAI) without touching business logic.

### Port (defined in the domain package)

```java
// review/ReviewAiPort.java
public interface ReviewAiPort {
    /**
     * Reviews a player's code submission against the task spec and guidelines.
     */
    ReviewResult review(String taskSpec, String submission, String guidelines);
}
```

### Adapter (LangChain4j implementation)

```java
// review/OllamaReviewAdapter.java
@ApplicationScoped
public class OllamaReviewAdapter implements ReviewAiPort {

    @RegisterAiService
    interface OllamaProxy {
        @SystemMessage("You are a senior Java developer reviewing a junior's code...")
        @UserMessage("Task: {{taskSpec}}\n\nCode:\n{{submission}}\n\nGuidelines:\n{{guidelines}}")
        String review(String taskSpec, String submission, String guidelines);
    }

    @Inject OllamaProxy proxy;

    @Override
    public ReviewResult review(String taskSpec, String submission, String guidelines) {
        String raw = proxy.review(taskSpec, submission, guidelines);
        return ReviewResult.parse(raw);
    }
}
```

### Service (depends only on the port)

```java
// review/ReviewService.java
@ApplicationScoped
public class ReviewService {
    @Inject ReviewAiPort aiPort;       // port — not the adapter directly
    @Inject ReviewRepository repository;

    public Review triggerReview(Long submissionId) {
        // ... uses aiPort.review(...) — no LangChain4j imports here
    }
}
```

Prompt templates live in `src/main/resources/prompts/` as `.txt` files.

**Testing AI services:** Inject a mock of the port interface — never call real Ollama in tests.

```java
@InjectMock
ReviewAiPort reviewAiPort;

when(reviewAiPort.review(any(), any(), any())).thenReturn(mockResult);
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
| Other `WebApplicationException` (e.g. `NotAllowedException`) | its own status (e.g. 405) |
| `RuntimeException` (fallback) | 500 |

All mappers emit the standard error JSON format. Log unexpected errors at `ERROR` level with full stack traces.

---

## Database Migrations

- Tool: Flyway (included via Quarkus extension)
- Location: `src/main/resources/db/migration/`
- Naming: `V{n}__{description}.sql` (e.g. `V1__create_user_table.sql`)
- Dev mode: `quarkus.hibernate-orm.database.generation=drop-and-create` (no migration run)
- Prod mode: `quarkus.hibernate-orm.database.generation=validate` + Flyway runs on startup

### Reserved Versions

Phases worked in parallel reserve their version numbers up front so branches don't collide. Never edit a migration that has already been deployed; add a new one instead.

| Version | File | Task | Status |
|---|---|---|---|
| V1–V6 | user, topics, player profile, profile topics, topic seed, tasks | Phases 1–2 | Applied |
| V7 | `V7__add_task_codebase_scope.sql` | P3-03 | Merged (PR #17) |
| V8 | `V8__create_xp_event_table.sql` | P7-03 | Added in Phase 7 (PR #16) |

Flyway rejects out-of-order versions by default. **V7 must be merged to `dev` before V8.** If P7-03 is ready first, merge P3-03's migration on its own first. Don't create placeholder files: once Flyway applies a migration, editing it fails checksum validation on the next startup.

---

## Observability

- `quarkus-opentelemetry` exports HTTP traces, ordinary application logs, and metrics via OTLP HTTP/protobuf; logs and metrics are enabled at build time (Quarkus 3.33.2).
- Service identity: `OTEL_SERVICE_NAME` (default `coding-tycoon-backend`); resource `deployment.environment` from `DEPLOYMENT_ENVIRONMENT`.
- Endpoint: `OTEL_EXPORTER_OTLP_ENDPOINT`, default `http://127.0.0.1:4318` for host execution; Compose supplies `http://lgtm:4318` on its existing default network.
- Stdout logging remains enabled. The test profile disables the telemetry SDK.
- Local LGTM stores telemetry in `lgtm-data:/data`; Grafana requires credentials and all published telemetry ports bind to loopback. See [operating notes](../observability/README.md).
- Browser telemetry is deferred; React/Vite is unchanged.
- Importable Grafana starter dashboard: [`coding-tycoon-backend.json`](../observability/dashboards/coding-tycoon-backend.json), covering HTTP rates/latency, JVM memory/GC, logs, and traces with service/environment filters. Import instructions and metric assumptions are in the [operating notes](../observability/README.md#import-the-starter-dashboard).
- Structured log records via JBoss LogManager (Quarkus default)
- Log levels: `INFO` globally, `DEBUG` for `dev.codingtycoon.*`
- Health endpoints: `/q/health` (SmallRye aggregated), `/api/health` (custom)
- Log AI requests/responses in dev mode (`quarkus.langchain4j.ollama.log-requests=true`)
- Do not log JWT payloads or user code submissions at `DEBUG` in production
