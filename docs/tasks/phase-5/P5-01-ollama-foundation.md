# P5-01 — Ollama Foundation (first real AI call)

**Phase:** 5 — AI Review Engine
**Status:** 🔄 In progress: code done, real call on staging pending
**Depends on:** none
**Trello:** [AI] Ollama + LangChain4j spike, https://trello.com/c/78g7uGx3 (the card holds the full doability check and traps)

---

## Goal

Make one real AI call on staging through a port, so the reviewer (P5-04) is built on a proven setup. CI keeps running without Ollama, and an Ollama outage falls back to seed tasks.

This task is the spike card, moved into Phase 5 (owner, 2026-11-14). It replaces the deferred P0-03.

---

## Acceptance Criteria

- [x] `quarkus-langchain4j-ollama` `1.13.4` pinned in `pom.xml` (it targets our Quarkus 3.33.2). `./mvnw verify` passes. If the old `ChatMemoryProcessor` regression comes back, stop and record it on the card.
- [x] `TaskService.generateTask()` calls the AI **outside** the DB transaction. The "active task" check and the save stay transactional. Test first.
- [x] `OllamaTaskAdapter` implements `TaskAiPort` with `prompts/task-generator.txt`. Unit tests use mocks, never a real Ollama.
- [x] **AI behind a replaceable boundary** (owner, 2026-11-14), so the provider can change without touching the domain:
  - Ports and their request/result types live in the domain (`task.TaskAiPort`, later `review.ReviewAiPort`). They use only our own types.
  - Every adapter lives in one infrastructure package per provider: `ai.stub`, `ai.ollama`. LangChain4j and Ollama types never leave `ai.ollama`; an ArchUnit test (or a plain test scanning imports) fails the build if they do.
  - Prompt templates stay in `prompts/` as plain text, provider-agnostic.
  - One config key picks the provider for every port: `codingtycoon.ai.provider=stub|ollama`, stub by default, so one image runs everywhere. Base URL, model and timeout are externalized per provider. Request/response logging is `%dev` only.
  - A shared contract test that every `TaskAiPort` adapter must pass (valid output, empty on failure). A new provider is one package, one config value and passing the contract test.
- [x] Fault tolerance (`quarkus-smallrye-fault-tolerance`, version from the Quarkus BOM): timeout and circuit breaker; retry on connection failures only, never on timeouts. Malformed output, a timeout or an outage return `Optional.empty()`, so the player gets a seed task, never a 500.
- [x] Dev Services for Ollama are off (`quarkus.langchain4j.ollama.devservices.enabled=false`): tests and CI need no model.
- [x] Ollama in `docker-compose.yml`: pinned image tag, no published port, `ollama_data` volume, a healthcheck that works in that image, no `sleep && ollama pull` race. The backend starts and serves seed tasks while Ollama is down.
- [x] The AI timeout stays below nginx's `proxy_read_timeout` for `/api/` (60 s default), or the proxy timeout is raised on purpose and documented.
- [x] `docs/STAGING_DEPLOY.md`: host RAM and disk needs, how the model gets onto the host (`ollama pull deepseek-coder:6.7b-instruct-q4_K_M`, about 4.1 GB).
- [ ] A real call on staging. Host CPU and RAM, latency and one sample output are recorded on the card and in the Result section below. Latency is information, not a gate.
- [x] Clean up: P0-03 marked superseded, `backend/SPEC.md`, `CHANGELOG.md`, ROADMAP Phase 0 line on the deferred extension, and the stale "Phase 3" notes in `pom.xml`, `application.properties` and `StubTaskAdapter`.

---

## Decisions

- Prove the call through `TaskAiPort`. No `/api/ai/ping`: a public endpoint that starts model calls needs abuse protection we don't want.
- Model: DeepSeek-Coder 6.7B Q4_K_M, CPU only on the homelab. Changing model must only take config.
- Production moves to a managed model provider with one new adapter and config (ROADMAP "AI model vendor upgrade"). No Ollama types in the domain keeps that cheap.

---

## Definition of Done

A real task-generation call works on staging, CI is green without Ollama, an Ollama outage still gives a seed task, and the latency is recorded. That latency sets the review timeouts in P5-03.

---

## Result

**Local real call (2026-11-14).** Two calls through `TaskAiPort` with `codingtycoon.ai.provider=ollama`, local Ollama 0.21.1 (Homebrew), `deepseek-coder:6.7b-instruct-q4_K_M`, on an Apple M4 with 16 GB. Ollama on macOS uses the GPU (Metal), so this is faster than the CPU-only staging host will be.

| Call | Latency | Result |
|---|---|---|
| 1 (model loading) | 23.7 s | "Implement a REST API for User Management", Junior, `rest-apis, crud`, 3 criteria |
| 2 | 22.5 s | "Develop a CRUD application for a Book Store using REST APIs", Junior, `rest-apis, crud`, 4 criteria |

Both answers were valid JSON with every field. Observations for later work, not this task: the tasks are generic and not about `shopfront` (one asks for an H2 database), and they have no focus files, so they can't be played in the Editor. That's why gameplay stays on seed tasks.

**Staging:** pending. Deploy with `AI_PROVIDER=ollama`, pull the model (`docs/STAGING_DEPLOY.md`), then record host CPU and RAM, latency and a sample output here.
