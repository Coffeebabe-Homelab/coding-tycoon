# P3-06 — Phase 3 Integration Verification

**Phase:** 3 — Codebase Explorer  
**Status:** 🟡 Staging verified 2026-11-01 except deep-link refresh (❌) and focus-file links (⏳ retest). Tech debt since 2026-11-14 (owner): doesn't block Phase 5  
**Depends on:** P3-01 through P3-05  

---

## Goal

Verify the Phase 3 exit criteria end-to-end before closing the phase.

---

## Exit Criteria (from ROADMAP)

### Explorer flow
- [ ] Log in → Task Board shows today's task with focus-file links — ⏳ not seen on staging: only 3 of 10 seed tasks have focus files (list users, input validation, low-stock), and tasks created before V7 have none. Retest with one of those tasks.
- [ ] "Explore codebase" opens `/room/codebase` with the first focus file loaded — ⏳ link works; first-focus-file part pending with the retest above
- [x] Folders expand/collapse; clicking a file shows syntax-highlighted content
- [ ] A focus-file link from the Task Board opens that exact file — ⏳ pending with the retest above
- [ ] Refreshing `/room/codebase?file=...` reopens the same file — ❌ fails on staging: refresh triggers a full Auth0 login round trip (/callback) that always lands on /room. Tracked in https://trello.com/c/vnH7h4Wt

### Read-only
- [x] Typing in the editor does nothing
- [x] No write endpoint exists under `/api/codebase`

### Security checks
- [x] `GET /api/codebase/files` without a token → `401`
- [x] `GET /api/codebase/files/../../application.properties` (and URL-encoded variants) → `404`
- [x] A path not in `index.txt` → `404`

### Automated checks
- [x] `./mvnw verify` passes; line coverage ≥ 80% on `codebase` and the changed `task` code (`codebase` and `task` at 100% lines after PR #25). Branch coverage was handled in https://trello.com/c/eFVqXHhD
- [x] `npm run lint` and `npm run build` pass; Monaco is in its own chunk

### Staging
- [x] Deployed via Jenkins; smoke test green; explorer works on the staging URL (confirms the Monaco loading choice from P3-04: no CDN requests)

---

## On completion

- Tick Phase 3 in ROADMAP.md, set task statuses, add a CHANGELOG entry
- Open a PR from the feature branch to `main`

---

## Definition of Done

All checks above pass, with no known bugs in the explorer happy path.
