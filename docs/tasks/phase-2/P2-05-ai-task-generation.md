# P2-05 — AI Task Generation Port & Stub Adapter

**Phase:** 2 — Task Engine  
**Status:** ✅ Complete  
**Depends on:** P2-01 (Task entity), P2-02 (Seed tasks)  

---

## Goal

Define the AI task generation port so `TaskService` is decoupled from Ollama. Ship a stub adapter for MVP that returns `Optional.empty()` (causing `TaskService` to fall back to seed tasks). The prompt template is written but the real Ollama adapter is deferred to Phase 3/5.

---

## Acceptance Criteria

- [x] `TaskAiPort` interface: `Optional<GeneratedTask> generate(String language, String seniority, List<String> topics)`
- [x] `GeneratedTask` record: `title`, `description`, `acceptanceCriteria`, `difficulty`, `tags`
- [x] `StubTaskAdapter` — `@ApplicationScoped`, always returns `Optional.empty()`
- [x] `task-generator.txt` prompt template in `src/main/resources/prompts/`
- [x] `TaskService.generateTask()` uses `TaskAiPort` and falls back to `SeedTaskService` when AI returns empty

---

## Implementation Notes

The real Ollama adapter (`OllamaTaskAdapter`) is deferred due to `quarkus-langchain4j-ollama` version regression on Quarkus 3.33+. See ROADMAP Phase 0 deferred item. The stub ensures the full `POST /api/tasks/generate` flow is exercised in tests.

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/task/
├── TaskAiPort.java             ← port interface
├── GeneratedTask.java          ← record
└── StubTaskAdapter.java        ← stub adapter (CDI primary)

backend/src/main/resources/prompts/
└── task-generator.txt
```

---

## Definition of Done

`POST /api/tasks/generate` creates a task from seed data when AI stub returns empty. Tests pass. Port is ready to accept a real Ollama adapter in Phase 5.
