# P3-06 — Phase 3 Integration Verification

**Phase:** 3 — Codebase Explorer  
**Status:** 🔲 Not started  
**Depends on:** P3-01 through P3-05  

---

## Goal

Verify the Phase 3 exit criteria end-to-end before closing the phase.

---

## Exit Criteria (from ROADMAP)

### Explorer flow
- [ ] Log in → Task Board shows today's task with focus-file links
- [ ] "Explore codebase" opens `/room/codebase` with the first focus file loaded
- [ ] Folders expand/collapse; clicking a file shows syntax-highlighted content
- [ ] A focus-file link from the Task Board opens that exact file
- [ ] Refreshing `/room/codebase?file=...` reopens the same file

### Read-only
- [ ] Typing in the editor does nothing
- [ ] No write endpoint exists under `/api/codebase`

### Security checks
- [ ] `GET /api/codebase/files` without a token → `401`
- [ ] `GET /api/codebase/files/../../application.properties` (and URL-encoded variants) → `404`
- [ ] A path not in `index.txt` → `404`

### Automated checks
- [ ] `./mvnw verify` passes; coverage ≥ 80% on `codebase` and the changed `task` code
- [ ] `npm run lint` and `npm run build` pass; Monaco is in its own chunk

### Staging
- [ ] Deployed via Jenkins; smoke test green; explorer works on the staging URL (confirms the Monaco loading choice from P3-04)

---

## On completion

- Tick Phase 3 in ROADMAP.md, set task statuses, add a CHANGELOG entry
- Open a PR from the feature branch to `main`

---

## Definition of Done

All checks above pass, with no known bugs in the explorer happy path.
