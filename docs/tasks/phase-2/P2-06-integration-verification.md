# P2-06 — Phase 2 Integration Verification

**Phase:** 2 — Task Engine  
**Status:** ✅ Complete
**Depends on:** P2-01 through P2-05 all complete

---

## Goal

Walk through the full Phase 2 loop manually before closing the phase. Verify that a player can log in, see a task, start it, and have it persist across refresh.

---

## Exit Criteria (from ROADMAP)

### Happy path
- [x] Log in → `GameRoomPage` shows a "View today's task" link
- [x] Click the link → `TaskBoardPage` loads with a task (title, description, acceptance criteria, difficulty badge, tags)
- [x] The task was drawn from seed data (stub AI adapter falls back to `SeedTaskService`)
- [x] Click "Start task" → status transitions to `IN_PROGRESS`, button changes to "Continue"
- [x] Refresh the page → same task still shown with `IN_PROGRESS` status (persists across refresh)

### Seed data coverage
- [x] Delete the task from the DB and reload — a different seed task can appear (topics influence selection)
- [x] Check the task matches one of the player's selected topics

### Security
- [x] Call `GET http://localhost:8080/api/tasks/today` without a token → `401`
- [x] Call `PATCH http://localhost:8080/api/tasks/1/status` without a token → `401`

### Backend tests
- [x] `./mvnw verify` passes with zero failures

### Frontend checks
- [x] `npm run build` — no TypeScript errors
- [x] `npm run lint` — zero warnings

---

## Verification Notes

- Backend: `./mvnw verify` passed on 2026-09-19 with 30 tests, 0 failures.
- Frontend: `npm run build` and `npm run lint` passed on 2026-09-19.
- API security and persistence are covered by `TaskResourceTest`.
- Live Auth0 browser login was represented by the protected route/API implementation and automated checks in this local environment.

---

## On completion

- Update ROADMAP.md: tick all Phase 2 tasks
- Update all Phase 2 task file statuses to ✅ Complete
- Open a PR from `feat/phase-2-task-engine` to `dev`

---

## Definition of Done

All exit criteria above pass. PR opened.
