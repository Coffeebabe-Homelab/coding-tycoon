# P2-01 — Task Entity, Repository & Flyway Migration

**Phase:** 2 — Task Engine  
**Status:** ✅ Complete  
**Depends on:** P1-01 (User entity), P1-02 (PlayerProfile entity)  

---

## Goal

Create the `Task` entity, its port/adapter pair, a `TaskStatus` enum, and the V6 Flyway migration. Tags are stored as comma-separated TEXT for H2/PostgreSQL compatibility.

---

## Acceptance Criteria

- [x] `TaskStatus` enum: `ASSIGNED`, `IN_PROGRESS`, `SUBMITTED`, `APPROVED`, `CHANGES_REQUESTED`
- [x] `Task` entity in `dev.codingtycoon.task` with fields: `id`, `profileId`, `title`, `description`, `acceptanceCriteria`, `difficulty`, `tags` (TEXT, comma-separated), `status`, `createdAt`
- [x] `TaskRepository` port interface: `findTodayForProfile`, `findTaskById`, `save`
- [x] `JpaTaskRepository` Panache adapter implementing `TaskRepository`
- [x] Flyway migration `V6__create_tasks_table.sql` — H2 and PostgreSQL compatible
- [x] Tags column is plain `TEXT` (comma-separated), not `TEXT[]`

---

## Implementation Notes

Tags stored as comma-separated string (`"java,oop,collections"`) to avoid dialect differences between H2 (tests) and PostgreSQL (prod). Split/join happens in `TaskResponse.from(Task)`.

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/task/
├── Task.java
├── TaskStatus.java
├── TaskRepository.java         ← port
└── JpaTaskRepository.java      ← adapter

backend/src/main/resources/db/migration/
└── V6__create_tasks_table.sql
```

---

## Definition of Done

Migration runs cleanly on H2 (tests) and PostgreSQL (dev/prod). Task can be persisted and retrieved. All tests pass.
