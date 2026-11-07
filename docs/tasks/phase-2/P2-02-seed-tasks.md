# P2-02 — Seed Tasks (10 Hand-Crafted Java/Junior Tasks)

**Phase:** 2 — Task Engine  
**Status:** ✅ Complete  
**Depends on:** P2-01 (Task entity)  

---

## Goal

Provide 10 hand-crafted fallback tasks for Java/Junior players. Seed tasks decouple early testing from Ollama availability and ensure the game is playable without AI.

---

## Acceptance Criteria

- [x] `SeedTask` record: `title`, `description`, `acceptanceCriteria`, `difficulty`, `tags`
- [x] `SeedTaskService` with 10 seed tasks covering all 5 topics
- [x] `getAll()`, `getRandom()`, `getForTopics(List<String>)` methods
- [x] Tasks are Java/Junior appropriate
- [x] All 5 topics represented across the 10 tasks

---

## Implementation Notes

`SeedTaskService` is `@ApplicationScoped`. Seeds are defined as in-memory data, no DB table needed. `getForTopics` filters by matching any tag to the provided topic IDs (case-insensitive).

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/task/seed/
├── SeedTask.java
└── SeedTaskService.java
```

---

## Definition of Done

`SeedTaskService.getAll()` returns 10 tasks. `getRandom()` returns a non-null task. `getForTopics()` filters correctly.
