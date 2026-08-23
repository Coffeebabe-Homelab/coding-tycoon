# Development Guidelines — Coding Tycoon

> This document is the team's shared agreement on how to build this project.
> It must be read before starting any Phase 1 work and treated as a living document — update it when patterns change.

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

## Backend Guidelines

### Layering

Every feature follows a strict three-layer structure:

```
Resource  (JAX-RS)   — HTTP boundary: request parsing, response building, status codes
  └─▶ Service        — Business logic: orchestration, validation, AI calls
        └─▶ Repository (Panache) — Data access: queries, persistence
```

Never call a `Repository` from a `Resource`. Never put HTTP concerns in a `Service`.

### Package Structure

```
dev.codingtycoon/
├── task/        TaskResource, TaskService, TaskRepository, Task (entity)
├── review/      ReviewResource, ReviewService, ReviewRepository, Review (entity)
├── profile/     ProfileResource, ProfileService, PlayerProfile (entity), SkillProfile (entity)
├── user/        UserResource, UserService, User (entity)
├── vcs/         VcsResource, VcsService, Submission (entity)
└── ai/          Shared AI service interfaces and prompt holders
```

### Naming Conventions

- Classes: `PascalCase`
- Methods and fields: `camelCase`
- REST resources: plural nouns (`/api/tasks`, `/api/reviews`)
- Entity fields: `camelCase` mapped to `snake_case` columns via Panache defaults
- Constants: `SCREAMING_SNAKE_CASE`

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

AI service interfaces must be **mocked** in all tests. Never call real Ollama in CI.
Use `@InjectMock` or a test `@Alternative` CDI bean to substitute the AI interface.

### Frontend

| Layer | Tool | Minimum coverage |
|---|---|---|
| Hooks and utilities | Vitest | ≥ 70% on business logic |
| Components | React Testing Library | Render, interaction, accessibility |

Do not test implementation details (internal state, private functions). Test behaviour.

### AI Quality (separate from unit/integration tests)

Prompt quality is evaluated via standalone scripts in `ai/evals/` — not in the main test suite.
CI only runs deterministic tests. AI eval runs are manual or triggered separately.

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
