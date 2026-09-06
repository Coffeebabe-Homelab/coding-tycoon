# P2-06 — Phase 2 Integration Verification

**Phase:** 2 — Task Engine  
**Status:** 🔲 Not started  
**Depends on:** P2-01 through P2-05 all complete

---

## Goal

Walk through the full Phase 2 loop manually before closing the phase. Verify that a player can log in, see a task, start it, and have it persist across refresh.

---

## Exit Criteria (from ROADMAP)

### Happy path
- [ ] Log in → `GameRoomPage` shows a "View today's task" link
- [ ] Click the link → `TaskBoardPage` loads with a task (title, description, acceptance criteria, difficulty badge, tags)
- [ ] The task was drawn from seed data (check backend logs for "seed" or verify via `GET /api/tasks/today`)
- [ ] Click "Start task" → status transitions to `IN_PROGRESS`, button changes to "Continue"
- [ ] Refresh the page → same task still shown with `IN_PROGRESS` status (persists across refresh)

### Seed data coverage
- [ ] Delete the task from the DB and reload — a different seed task appears (topics influence selection)
- [ ] Check the task matches one of the player's selected topics

### Security
- [ ] Call `GET http://localhost:8080/api/tasks/today` without a token → `401`
- [ ] Call `PATCH http://localhost:8080/api/tasks/1/status` without a token → `401`

### Backend tests
- [ ] `./mvnw verify` passes with zero failures

### Frontend checks
- [ ] `npm run build` — no TypeScript errors
- [ ] `npm run lint` — zero warnings

---

## On completion

- Update ROADMAP.md: tick all Phase 2 tasks
- Update all Phase 2 task file statuses to ✅ Complete
- Open a PR from `feat/phase-2-task-engine` to `dev`

---

## Definition of Done

All exit criteria above pass. PR opened.
