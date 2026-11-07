# P0-11 — Backend SPEC.md

**Phase:** 0 — Foundation  
**Status:** ✅ Complete  
**Depends on:** P0-02, P0-10  

---

## Goal

Write `backend/SPEC.md` — the authoritative technical specification for the backend. This document guides every developer (and AI tooling) working on the backend throughout the project.

---

## Acceptance Criteria

- [x] `backend/SPEC.md` exists
- [x] Module structure documented (all planned packages: `task`, `review`, `profile`, `user`, `vcs`)
- [x] REST API conventions defined (base path, versioning, response envelope, error format)
- [x] Data model overview: entity list with key fields and relationships (ER-style, text or diagram)
- [x] AI integration pattern documented: how `@RegisterAiService` services are structured, how prompts are organised, how AI calls are tested
- [x] Authentication model: how Auth0 JWTs are validated, how `sub` claim maps to users, which endpoints are public vs protected
- [x] Error handling strategy: exception mappers, HTTP status code conventions, error response format
- [x] Observability: structured logging format, health check endpoints, what to log at each level
- [x] Database migration strategy: Flyway scripts in `src/main/resources/db/migration/`

---

## Content Outline

```
# Backend Specification — Coding Tycoon

## Tech Stack
[Quarkus, Java 21, Panache ORM, PostgreSQL, LangChain4j Ollama, Auth0 OIDC]

## Module Structure
backend/src/main/java/dev/codingtycoon/
├── task/        — Task entity, TaskResource, TaskService, TaskRepository, AI task generator
├── review/      — Review entity, ReviewResource, ReviewService, AI reviewer + feedback engine
├── profile/     — PlayerProfile entity, SkillProfile entity, ProfileResource, ProfileService
├── user/        — User entity, onboarding settings
├── vcs/         — Submission entity, VcsResource, diff computation
└── ai/          — Shared AI service interfaces, prompt template holders

## REST API Conventions
- Base path: /api
- No versioning for MVP (add /v1 when breaking changes needed)
- Response format: plain JSON body (no envelope for 200s)
- Error format: { "error": "...", "message": "...", "status": 400 }
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

## Data Model Overview
[Entity relationship summary]

## AI Integration Pattern
[How prompts are structured, @RegisterAiService usage, testing strategy]

## Authentication & Authorisation
[JWT validation, sub claim, public vs protected endpoints]

## Error Handling
[ExceptionMappers, logging]

## Database Migrations
[Flyway conventions]

## Observability
[Logging levels, health endpoints]
```

---

## Definition of Done

- Document exists and covers all sections. Reviewed before any Phase 1 backend work begins. Treated as a living document — updated when API contracts change.
