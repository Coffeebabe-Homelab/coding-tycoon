# P0-09 — README.md

**Phase:** 0 — Foundation  
**Status:** ✅ Complete  
**Depends on:** P0-01, P0-02, P0-04  

---

## Goal

Write a `README.md` at repo root that lets any developer clone the repo and run the full local stack in under 10 minutes, with zero ambiguity.

---

## Acceptance Criteria

- [x] `README.md` exists at repo root
- [x] Covers: project description (one paragraph), prerequisites, local setup steps, running frontend, running backend, running tests
- [x] Prerequisites listed: Node 20+, Java 21+, Docker, Ollama, Auth0 account
- [x] `docker compose up -d` is the first setup step
- [x] Auth0 setup instructions reference P0-05 (or inline the steps)
- [x] `.env.local` setup for frontend is documented
- [x] Backend env vars documented
- [x] CI badge in the header
- [x] Links to `ROADMAP.md`, `north_star.md`, `docs/DEVELOPMENT_GUIDELINES.md`

---

## Structure

```markdown
# Coding Tycoon

> [one-line description]

[![CI](badge-url)](actions-url)

## What is this?
[2–3 sentences from north_star.md vision]

## Prerequisites
- Node.js 20+
- Java 21+ (Temurin recommended)
- Docker + Docker Compose
- Ollama (for local AI)
- Auth0 account (free tier)

## Local Setup
1. Clone the repo
2. Start infrastructure: `docker compose up -d`
3. Configure Auth0 (see [Auth0 Setup](#auth0-setup))
4. Configure environment variables
5. Start backend: `cd backend && ./mvnw quarkus:dev`
6. Start frontend: `cd frontend && npm install && npm run dev`
7. Open http://localhost:5173

## Auth0 Setup
[Steps from P0-05]

## Environment Variables
[Tables for frontend and backend env vars]

## Running Tests
[frontend: npm test | backend: ./mvnw test]

## Project Docs
- [North Star](./north_star.md)
- [Roadmap](./ROADMAP.md)
- [Development Guidelines](./docs/DEVELOPMENT_GUIDELINES.md)
- [Backend Spec](./backend/SPEC.md)
- [Frontend Spec](./frontend/SPEC.md)
```

---

## Definition of Done

- A developer unfamiliar with the project can follow the README and have the stack running locally with no additional help.

---

## Closure Note (2026-11-01)

README setup steps were revised on 2026-11-01 to match the current environment handling and the Java 25 requirement.
