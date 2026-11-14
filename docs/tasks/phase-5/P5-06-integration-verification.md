# P5-06 — Phase 5 Integration Verification

**Phase:** 5 — AI Review Engine
**Status:** ⬜ Not started
**Depends on:** P5-01 through P5-05 and P5-07

---

## Goal

Verify the Phase 5 exit criteria end to end on staging, with the real model, before closing the phase.

---

## Exit Criteria (from ROADMAP)

### Review loop
- [ ] Push → a review appears in the Review tab without a refresh. The latency is recorded against `codingtycoon.review.target-duration`, and the target is tuned on staging by changing the env value only
- [ ] Approved: the task closes, the success state shows, and "Ship it & end the day" opens End of Day
- [ ] Changes requested: the comments show anchored to code; "Fix in editor" reopens editable files from the last push; the next push is attempt 2
- [ ] Several attempts are numbered correctly, and the attempt dots match

### Failures
- [ ] Ollama stopped during a review → `FAILED` after the retries, Screen 11b shows, and the attempt is not used up. Ollama back → Retry → a review arrives
- [ ] Backend restarted during a review → the review is picked up again and finishes

### XP
- [ ] The approval pays the ticket XP once, plus the first-try bonus only on attempt 1
- [ ] HUD and End of Day show the same XP and streak as `GET /api/progress` (deferred from P7-06)

### Replaceability
- [ ] The import check passes: no provider types outside `ai.<provider>`, no JPA in `review.worker`
- [ ] Every `TaskAiPort`, `ReviewAiPort` and `ReviewQueue` adapter passes its contract test

### Observability
- [ ] The AI row in Grafana shows the staging calls, queue depth and reviews over target (P5-07)

### Security
- [ ] `GET /api/reviews/latest` and `POST /api/reviews/{id}/retry` without a token → `401`
- [ ] Another player's review id on retry → `404`, and nothing changes

### Quality
- [ ] Backend and frontend coverage ≥ 80% lines and branches
- [ ] The P5-04 evals are run on staging and their results recorded
- [ ] Screens 7a, 7b and 11b compared with Figma at 1440×900 and checked at 1280

---

## Definition of Done

Every box is ticked, ROADMAP Phase 5 is checked off, and the result is recorded here.
