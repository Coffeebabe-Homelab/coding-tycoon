# P5-01 — Ollama Foundation (first real AI call)

**Phase:** 5 — AI Review Engine
**Status:** ⬜ Not started
**Depends on:** none
**Trello:** [AI] Ollama + LangChain4j spike, https://trello.com/c/78g7uGx3 (the card holds the full doability check and traps)

---

## Goal

Make one real AI call on staging through a port, so the reviewer (P5-04) is built on a proven setup. CI keeps running without Ollama, and an Ollama outage falls back to seed tasks.

This task is the spike card, moved into Phase 5 (owner, 2026-11-14). It replaces the deferred P0-03.

---

## Acceptance Criteria

- [ ] `quarkus-langchain4j-ollama` `1.13.4` pinned in `pom.xml` (it targets our Quarkus 3.33.2). `./mvnw verify` passes. If the old `ChatMemoryProcessor` regression comes back, stop and record it on the card.
- [ ] `TaskService.generateTask()` calls the AI **outside** the DB transaction. The "active task" check and the save stay transactional. Test first.
- [ ] `OllamaTaskAdapter` implements `TaskAiPort` with `prompts/task-generator.txt`. No LangChain4j or Ollama types outside the adapter. Unit tests use mocks, never a real Ollama.
- [ ] The adapter is chosen by runtime config (`codingtycoon.ai.provider=stub|ollama`, stub by default), so one image runs everywhere. Base URL, model and timeout are externalized. Request/response logging is `%dev` only.
- [ ] Fault tolerance (`quarkus-smallrye-fault-tolerance`, version from the Quarkus BOM): timeout and circuit breaker; retry on connection failures only, never on timeouts. Malformed output, a timeout or an outage return `Optional.empty()`, so the player gets a seed task, never a 500.
- [ ] Dev Services for Ollama are off (`quarkus.langchain4j.ollama.devservices.enabled=false`): tests and CI need no model.
- [ ] Ollama in `docker-compose.yml`: pinned image tag, no published port, `ollama_data` volume, a healthcheck that works in that image, no `sleep && ollama pull` race. The backend starts and serves seed tasks while Ollama is down.
- [ ] The AI timeout stays below nginx's `proxy_read_timeout` for `/api/` (60 s default), or the proxy timeout is raised on purpose and documented.
- [ ] `docs/STAGING_DEPLOY.md`: host RAM and disk needs, how the model gets onto the host (`ollama pull deepseek-coder:6.7b-instruct-q4_K_M`, about 4.1 GB).
- [ ] A real call on staging. Host CPU and RAM, latency and one sample output are recorded on the card and in the Result section below. Latency is information, not a gate.
- [ ] Clean up: P0-03 marked superseded, `backend/SPEC.md`, `CHANGELOG.md`, ROADMAP Phase 0 line on the deferred extension, and the stale "Phase 3" notes in `pom.xml`, `application.properties` and `StubTaskAdapter`.

---

## Decisions

- Prove the call through `TaskAiPort`. No `/api/ai/ping`: a public endpoint that starts model calls needs abuse protection we don't want.
- Model: DeepSeek-Coder 6.7B Q4_K_M, CPU only on the homelab. Changing model must only take config.
- Production moves to a managed model provider with one new adapter and config (ROADMAP "AI model vendor upgrade"). No Ollama types in the domain keeps that cheap.

---

## Definition of Done

A real task-generation call works on staging, CI is green without Ollama, an Ollama outage still gives a seed task, and the latency is recorded. That latency sets the review timeouts in P5-03.
