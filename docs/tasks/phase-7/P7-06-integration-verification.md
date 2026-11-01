# P7-06 — Phase 7 Integration Verification

**Phase:** 7 — Game Shell  
**Status:** 🟡 Automated checks done; manual browser and staging checks pending  
**Depends on:** P7-01 through P7-05  

---

## Goal

Verify the Phase 7 exit criteria end-to-end before closing the phase.

---

## Exit Criteria (from ROADMAP)

### Game feel
- [ ] Login lands in the room scene; the avatar sits at the desk
- [ ] Hotspots open Task Board / Codebase Explorer / Profile as overlays; Esc and the back button close them
- [ ] With an `ASSIGNED` task, the Task Board opens automatically once per session
- [ ] No page reads as a raw CRUD form, and nothing scrolls horizontally at 1280px

### XP & streak
- [x] Approving a task (via API until Phase 5) adds XP once; repeating the call doesn't add more
- [ ] HUD and End of Day show the same XP and streak values as `GET /api/progress`
- [x] Streak behaves per the P7-04 decision across consecutive and skipped days (backend tests)

### Security checks
- [x] `GET /api/progress` without a token → `401`

### Automated checks
- [x] `./mvnw verify` passes; coverage ≥ 80% on `progress` and the changed `task` code
- [x] `npm run lint` and `npm run build` pass

### Staging
- [ ] Deployed via Jenkins; smoke test green; room and overlays work on the staging URL

---

## Verification log (Phase 7 branch)

- Backend: `TaskResourceTest.approvingTaskAwardsXpExactlyOnce` (second `APPROVED` → `422`, still one XP event), `ProgressServiceTest.awardForApprovalIsIdempotent`, `StreakCalculatorTest` (7 scenarios).
- `GET /api/progress` → `401` without a token and with an invalid token, checked with curl against the packaged app in prod mode on PostgreSQL 16; Flyway applied V1–V6 + V8 and Hibernate `validate` passed.
- Pending (needs a browser with Auth0 or staging): game feel items, HUD vs End of Day values, Jenkins deploy and smoke test.

## On completion

- Tick Phase 7 in ROADMAP.md, set task statuses, add a CHANGELOG entry
- Open a PR from the feature branch to `main`

---

## Definition of Done

All checks above pass; the loop feels cohesive for the parts that exist (login → room → task → end of day).
