# Development Guidelines — Coding Tycoon

> This document is the team's shared agreement on how to build this project.
> It must be read before starting any Phase 1 work and treated as a living document — update it when patterns change.

---

## A Note on Frontend Work

The frontend owner is using this project to **learn frontend design and development**. This has two practical consequences:

1. Before implementing any frontend piece, I (Kiro) will explain **what we are building, why we are making that choice, and what the alternatives are** — so you can make an informed decision rather than just accepting a default.
2. Frontend decisions (component structure, state management patterns, styling choices) will be explained step by step as we go. If something is unclear, ask — explaining it is part of the job.

---

## Architecture Overview

```
Browser
  └─▶ React App (Vite + TypeScript + Tailwind)   :5173
        ├─▶ Auth0 Universal Login (OIDC / PKCE)
        └─▶ Quarkus REST API                      :8080
              ├─▶ PostgreSQL (Panache ORM)         :5432
              └─▶ Ollama (LangChain4j)             :11434
                    └─▶ DeepSeek-Coder 6.7B Q4_K_M
```

All browser requests to `/api/*` carry an `Authorization: Bearer <token>` header.
The backend validates the JWT against Auth0's JWKS endpoint automatically via Quarkus OIDC.

---

## Architecture Decision: DDD Package Structure + Light Hexagonal Boundaries

**Decision date:** 2026-08-31

### What we chose and why

We combine two complementary patterns at a pragmatic level:

- **Domain-Driven Design (DDD) package structure** — packages are named after business concepts (`task/`, `review/`, `profile/`), not technical layers (`controllers/`, `repositories/`). This keeps related code together and mirrors the real domain.

- **Light Hexagonal Architecture (Ports & Adapters) at external boundaries** — we apply explicit port interfaces only where the external dependency is likely to change or needs to be mocked cleanly in tests. For this project, that means the **AI boundary** (Ollama will eventually be swapped for a cloud provider) and optionally persistence.

We deliberately avoid full tactical DDD (aggregate roots, domain events, value objects throughout) and full Hexagonal everywhere. The overhead is not justified for a solo project at MVP stage.

### What this looks like in practice

**Ports** are interfaces defined in the domain package, pointing outward:

```java
// review/ReviewAiPort.java  — the domain defines what it needs
public interface ReviewAiPort {
    ReviewResult review(String taskSpec, String submission, String guidelines);
}
```

**Adapters** implement those ports using the actual infrastructure:

```java
// review/OllamaReviewAdapter.java  — an adapter plugs in the real implementation
@ApplicationScoped
public class OllamaReviewAdapter implements ReviewAiPort {
    // LangChain4j / Ollama code lives here, not in ReviewService
}
```

The **Service** only depends on the port interface — it never imports LangChain4j or Panache directly:

```java
// review/ReviewService.java
@ApplicationScoped
public class ReviewService {
    @Inject ReviewAiPort aiPort;          // port — not the Ollama adapter directly
    @Inject ReviewRepository repository;  // port — not a Panache class directly
}
```

In tests, you swap the adapter for a mock without touching the service.

### Where we apply Hexagonal (and where we don't)

| Boundary | Use Hexagonal? | Reason |
|---|---|---|
| AI services (Ollama) | ✅ Yes — `*AiPort` interface | Will change; needs mocking in tests |
| Persistence (Panache) | ✅ Yes — `*Repository` interface | Panache already encourages this pattern |
| HTTP (JAX-RS resources) | ❌ No port needed | HTTP is the entry point, not a replaceable dependency |
| Internal service calls | ❌ No port needed | Ports are for external systems only |

---

## Backend Guidelines

### Layering

Every feature follows this structure, with dependency direction flowing inward:

```
Resource  (JAX-RS adapter — HTTP in)
  └─▶ Service (domain/application core — pure business logic)
        ├─▶ *AiPort (interface — AI out)
        │     └─▶ *AiAdapter (Ollama / LangChain4j implementation)
        └─▶ *Repository (interface — DB out)
              └─▶ Panache implementation
```

Rules:
- Never call a `Repository` directly from a `Resource`.
- Never put HTTP concerns (`Response`, `@QueryParam`) in a `Service`.
- Services import only domain classes, port interfaces, and standard Java — never framework types.

### Package Structure

```
dev.codingtycoon/
├── task/
│   ├── Task.java                   Entity
│   ├── TaskRepository.java         Port (interface)
│   ├── JpaTaskRepository.java      Adapter (Panache implementation)
│   ├── TaskService.java            Domain/application core
│   └── TaskResource.java           Adapter (JAX-RS / HTTP)
│
├── review/
│   ├── Review.java
│   ├── ReviewRepository.java       Port
│   ├── JpaReviewRepository.java    Adapter
│   ├── ReviewAiPort.java           Port (AI boundary — key isolation point)
│   ├── OllamaReviewAdapter.java    Adapter (LangChain4j implementation)
│   ├── ReviewService.java          Domain/application core
│   └── ReviewResource.java         Adapter (JAX-RS)
│
├── profile/
│   ├── PlayerProfile.java
│   ├── SkillProfile.java
│   ├── ProfileRepository.java      Port
│   ├── JpaProfileRepository.java   Adapter
│   ├── SkillAiPort.java            Port (AI boundary)
│   ├── OllamaSkillAdapter.java     Adapter
│   ├── ProfileService.java         Domain/application core
│   └── ProfileResource.java        Adapter (JAX-RS)
│
├── user/
│   ├── User.java
│   ├── UserRepository.java         Port
│   ├── JpaUserRepository.java      Adapter
│   ├── UserService.java
│   └── UserResource.java
│
├── vcs/
│   ├── Submission.java
│   ├── SubmissionRepository.java   Port
│   ├── JpaSubmissionRepository.java Adapter
│   ├── VcsService.java
│   └── VcsResource.java
│
└── ai/
    └── (shared prompt constants — no business logic here)
```

### Naming Conventions

- Classes: `PascalCase`
- Methods and fields: `camelCase`
- REST resources: plural nouns (`/api/tasks`, `/api/reviews`)
- Entity fields: `camelCase` mapped to `snake_case` columns via Panache defaults
- Constants: `SCREAMING_SNAKE_CASE`
- Port interfaces: name by what they do, not how (`ReviewAiPort`, not `OllamaService`)
- Adapters: name by technology + what they adapt (`OllamaReviewAdapter`, `JpaTaskRepository`)

### REST API Standards

| Convention | Rule |
|---|---|
| Base path | `/api` |
| Versioning | None for MVP; add `/v1` prefix if breaking changes are needed |
| 200 responses | Plain JSON body — no envelope wrapper |
| Error format | `{ "error": "BadRequest", "message": "...", "status": 400 }` |
| Status codes | 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 422 Unprocessable, 500 Internal Server Error |
| Date format | ISO 8601 (`2026-08-22T10:00:00Z`) |

### Error Handling

- Define a central `ExceptionMapper` for `ConstraintViolationException` → 422, `NotFoundException` → 404
- Never let raw exceptions reach the client
- Log at `WARN` for expected errors (bad input), `ERROR` for unexpected errors

### Javadoc

All `public` methods on `Resource` and `Service` classes must have Javadoc.

---

## Frontend Guidelines

> Remember: every frontend decision will be explained before implementation. You will always know what we're building and why before we write any code.

### Component Structure

```
src/
├── components/    Reusable, stateless or lightly-stateful UI primitives
├── pages/         Route-level components — assemble components, call hooks
├── game/          Game-specific UI (room scene, session flow)
├── hooks/         Custom hooks — data fetching, domain logic
├── lib/           Pure utilities (api.ts, diff.ts, auth.ts)
├── store/         Zustand stores — global client-side state only
├── types/         Shared TypeScript interfaces and enums
└── assets/        Static files
```

### Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Types/interfaces: `PascalCase` with no `I` prefix

### State Management Rules

| Data type | Where it lives |
|---|---|
| Server data (tasks, reviews, profile) | React Query (TBD) or `useState` + fetch hook |
| Global UI state (current session, room mode) | Zustand store |
| Local component state (form values, toggles) | `useState` |

Do not put server-fetched data in Zustand. Keep stores lean — only state that multiple unrelated components need.

### API Integration

Always use the `fetchWithAuth` helper from `lib/api.ts`. Never inline `fetch` with auth headers in a component.

```ts
const token = await getAccessTokenSilently()
const data = await fetchWithAuth('/api/tasks/today', token)
```

Handle loading and error states on every API call.

### JSDoc

All exported TypeScript functions in `lib/` and `hooks/` must have JSDoc comments.

---

## Testing Strategy

### Backend

| Layer | Tool | Minimum coverage |
|---|---|---|
| Service layer | JUnit 5 + Mockito | ≥ 80% line coverage |
| Resource layer | Quarkus `@QuarkusTest` + REST Assured | Happy path + 401 per endpoint |
| Integration | `@QuarkusTest` with Dev Services | DB round-trips for critical paths |

AI port implementations must be **mocked** in all tests — use `@InjectMock` to substitute the port interface.
Never call real Ollama in CI.

```java
@InjectMock
ReviewAiPort reviewAiPort;

// In test:
when(reviewAiPort.review(any(), any(), any())).thenReturn(mockResult);
```

### Frontend

| Layer | Tool | Minimum coverage |
|---|---|---|
| Hooks and utilities | Vitest | ≥ 70% on business logic |
| Components | React Testing Library | Render, interaction, accessibility |

Do not test implementation details. Test behaviour.

### AI Quality (separate from unit/integration tests)

Prompt quality is evaluated via standalone scripts in `ai/evals/` — not in the main test suite.
CI only runs deterministic tests.

---

## Documentation Standards

- Javadoc on all `public` methods in `Resource` and `Service` layers
- JSDoc on all exported TypeScript functions in `lib/` and `hooks/`
- Update `backend/SPEC.md` whenever an API contract changes
- Update `frontend/SPEC.md` whenever the component tree or routing changes
- ADRs (Architecture Decision Records) for significant decisions — add as `docs/adr/ADR-NNN-title.md`

---

## Git Workflow

### Branches

- `main` — always deployable; CI must be green; protected branch
- `feat/<short-description>` — feature branches; one PR per feature
- `fix/<short-description>` — bug fix branches
- `chore/<short-description>` — non-functional changes (deps, tooling)

### Commit Messages (Conventional Commits)

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`

Examples:
```
feat(task): add AI task generation endpoint
fix(auth): return 401 instead of 500 for expired tokens
chore(deps): bump quarkus to 3.24.2
```

### PR Process & Checklist

Before opening a PR:
- [ ] All tests pass locally (`npm run lint && npm run build` / `./mvnw verify`)
- [ ] New code has tests (≥ coverage thresholds)
- [ ] Javadoc / JSDoc on new public API
- [ ] `SPEC.md` updated if API contracts changed
- [ ] Self-review done — read the diff yourself before requesting review
- [ ] PR description explains **why**, not just **what**

Branch protection on `main`: require CI green + 1 approving review before merge.
