# P2-03 — Task API Endpoints & State Machine

**Phase:** 2 — Task Engine  
**Status:** ✅ Complete  
**Depends on:** P2-01 (Task entity), P2-02 (Seed tasks), P2-05 (AI port)  

---

## Goal

Expose task management endpoints and enforce valid status transitions via a state machine in `TaskService`.

---

## Acceptance Criteria

- [x] `GET /api/tasks/today` — returns today's task (201 if newly created, 200 if existing); creates from seed if none exists
- [x] `PATCH /api/tasks/{id}/status` — transitions task status; returns 422 for invalid transitions
- [x] `POST /api/tasks/generate` — triggers AI task generation (stub); returns 409 if active task exists
- [x] State machine: `ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED / CHANGES_REQUESTED`
- [x] `UnprocessableException` mapped to 422
- [x] `TaskResponse` record with `from(Task)` factory (splits comma-separated tags into `List<String>`)
- [x] `UpdateTaskStatusRequest` with `@NotNull TaskStatus status`

---

## State Machine

```
ASSIGNED ──────────────────▶ IN_PROGRESS
IN_PROGRESS ───────────────▶ SUBMITTED
SUBMITTED ─────────────────▶ APPROVED
SUBMITTED ─────────────────▶ CHANGES_REQUESTED
CHANGES_REQUESTED ─────────▶ IN_PROGRESS
```

All other transitions return 422 Unprocessable Entity.

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/task/
├── TaskService.java
├── TaskResource.java
├── TaskResponse.java
├── UpdateTaskStatusRequest.java
└── Pair.java

backend/src/main/java/dev/codingtycoon/exception/
├── UnprocessableException.java
└── ExceptionMappers.java       ← updated with mapUnprocessable()
```

---

## Definition of Done

All 9 `TaskResourceTest` scenarios pass. State machine rejects invalid transitions with 422.
