# P3-03 — Scope Tasks to a Codebase

**Phase:** 3 — Codebase Explorer  
**Status:** ✅ Complete  
**Depends on:** P3-01  

---

## Goal

Each task knows which codebase it belongs to and which files it is about, so the explorer can open the right context.

---

## Acceptance Criteria

- [x] Flyway migration `V7__add_task_codebase_scope.sql` (reserved, see `backend/SPEC.md` § Reserved Versions) adds to `tasks`: `codebase_key VARCHAR NOT NULL DEFAULT 'shopfront'` and `focus_files TEXT NOT NULL DEFAULT ''` (comma-separated, same convention as `tags`)
- [x] `Task` entity, `SeedTask` record and `TaskResponse` expose `codebaseKey` and `focusFiles` (`List<String>` in the response)
- [x] Every seed task gets `codebaseKey = "shopfront"`; at least 3 seed tasks reference concrete `shopfront` files in `focusFiles` and mention them in the description
- [x] Seed task descriptions that conflict with `shopfront` are adjusted (e.g. the users list task points at `UserController`)
- [x] Every `focusFiles` entry exists in the codebase `index.txt` (enforced by a test)
- [x] AI-generated tasks (when enabled) default to `shopfront` with no focus files
- [x] Existing rows keep working after the migration (defaults applied)
- [x] Tests updated/added for the new fields

---

## Implementation Notes

- V7 is reserved for this task and V8 for P7-03. This migration must reach `dev` before V8, because Flyway rejects out-of-order versions. If P7-03 is ready first, merge this migration on its own first.
- Rewriting all seed tasks around `shopfront` is Phase 8 work; here only align what's needed so the descriptions point at real files.

---

## File Locations

```
backend/src/main/resources/db/migration/V7__add_task_codebase_scope.sql
backend/src/main/java/dev/codingtycoon/task/
├── Task.java            ← updated
├── TaskResponse.java    ← updated
└── seed/
    ├── SeedTask.java         ← updated
    └── SeedTaskService.java  ← updated
```

---

## Definition of Done

`./mvnw verify` passes; `GET /api/tasks/today` returns `codebaseKey` and `focusFiles`.
