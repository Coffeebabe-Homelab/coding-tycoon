# P7-03 — XP System (Backend)

**Phase:** 7 — Game Shell  
**Status:** 🔲 Not started  
**Depends on:** P2-03 (task status state machine), P3-03's `V7` migration merged first (Flyway ordering)  

---

## Goal

Award XP when a task is approved, and expose the player's XP through a `progress` API.

---

## Decisions (confirmed 2026-11-01)

1. **XP amounts:** `100` per approved task, plus `50` for approval on the first attempt.
2. **What "today" means:** the UTC calendar day for MVP; a player timezone can come later.

---

## Acceptance Criteria

- [ ] Flyway migration `V8__create_xp_event_table.sql` (reserved, see `backend/SPEC.md` § Reserved Versions) creates `xp_event` (`id`, `player_profile_id`, `task_id`, `amount`, `reason`, `created_at`) with a unique constraint on (`task_id`, `reason`), which makes awarding idempotent
- [ ] New `progress` package: `XpEvent` entity, `XpReason` enum (`TASK_APPROVED`), `ProgressService`, `ProgressResource`
- [ ] When a task transitions to `APPROVED`, `TaskService` calls `ProgressService.awardForApproval(task)`; repeating the transition never double-awards
- [ ] XP amounts are constants (`SCREAMING_SNAKE_CASE`) in `ProgressService`, not magic numbers
- [ ] `GET /api/progress` returns `{ "totalXp": n, "xpToday": n }` for the authenticated player; `401` without a token; `404` if no profile
- [ ] Tests: award on approval, idempotency, no award on other transitions, totals/today calculation, resource 200/401/404
- [ ] ≥ 80% line and branch coverage on `progress`
- [ ] `backend/SPEC.md` updated (package, data model, API)

---

## Implementation Notes

- Use a ledger (one row per award) instead of a running counter: totals and "XP today" are simple sums, and the unique constraint protects against double awards.
- **First-attempt bonus is deferred to Phase 5.** Attempts are only tracked once submissions and reviews exist; add an `XpReason.FIRST_ATTEMPT_BONUS` then. Don't add the enum value before it's used.
- Approval only happens in the real flow from Phase 5 onward; until then tests drive the state machine directly.
- V8 is reserved for this task. It can only reach `dev` after P3-03's V7, because Flyway rejects out-of-order versions. If this task is ready first, merge P3-03's migration on its own first.

---

## File Locations

```
backend/src/main/resources/db/migration/V8__create_xp_event_table.sql
backend/src/main/java/dev/codingtycoon/progress/
├── XpEvent.java
├── XpReason.java
├── ProgressService.java
├── ProgressResource.java
└── ProgressResponse.java
backend/src/main/java/dev/codingtycoon/task/TaskService.java  ← updated
```

---

## Definition of Done

`./mvnw verify` passes with coverage thresholds met; approving a task via the API adds exactly one XP event.
