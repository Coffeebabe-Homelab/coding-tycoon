# P7-04 — Streak Tracker (Backend)

**Phase:** 7 — Game Shell  
**Status:** ✅ Complete  
**Depends on:** P7-03  

---

## Goal

Track consecutive active days and expose them in `GET /api/progress`.

---

## Decision (confirmed 2026-11-01): option A, days with an approved task

ROADMAP said "daily login + task completion". The options considered were:

| Option | Pros | Cons |
|---|---|---|
| **A. Days with an approved task** *(recommended)* | Computed from the existing `xp_event` ledger, so no new table; rewards real work | Streak can't grow in the real flow until Phase 5 approvals exist |
| B. Days with a login *or* a completion | Streak works immediately | Needs a login-tracking table and a hook on every authenticated session; rewards showing up rather than finishing |

---

## Acceptance Criteria

- [x] `currentStreak`: consecutive days ending today (or yesterday, so the streak isn't lost before today's work) with at least one `TASK_APPROVED` XP event (no new table or migration needed)
- [x] `longestStreak`: the longest such run ever
- [x] Both added to the `GET /api/progress` response
- [x] Same "day" definition as P7-03 (UTC unless decided otherwise)
- [x] Tests: no activity → 0; single day; consecutive run; gap resets current but keeps longest; yesterday-only keeps the streak alive; multiple events on one day count once
- [x] ≥ 80% line and branch coverage maintained on `progress`
- [x] `backend/SPEC.md` API updated

---

## Implementation Notes

- Compute from distinct event dates in one query. Player history is small, so no caching is needed.
- Keep the date logic in a small pure method with a passed-in `today` to keep tests deterministic.

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/progress/
├── ProgressService.java   ← updated
├── StreakCalculator.java  ← pure date logic
└── ProgressResponse.java  ← updated
```

---

## Definition of Done

`./mvnw verify` passes; `GET /api/progress` returns correct streak values for the test scenarios.
