# P4-05 — Phase 4 Integration Verification

**Phase:** 4 — Code Editor & VCS Panel  
**Status:** ⬜ Not started  
**Depends on:** P4-01 through P4-04  

---

## Goal

Verify the Phase 4 exit criteria end to end, locally and on staging, before closing the phase.

---

## Exit Criteria (from ROADMAP)

### Editor
- [ ] A new task opens in the Editor with its focus files, each starting from the codebase original
- [ ] Edits survive tab switches, closing the panel and a Profile visit
- [ ] Keyboard only: Tab leaves the editor with Ctrl/Cmd+M; Esc inside the editor doesn't close the panel

### Push
- [ ] The VCS tab lists the changed files and shows their diff, in Unified and Split
- [ ] Commit message plus confirm pushes the submission; the task is `SUBMITTED` in the database with attempt 1
- [ ] After a refresh, the Editor is read-only and VCS shows the pushed state

### Security checks
- [ ] `POST /api/submissions` without a token → `401`
- [ ] A path outside the task's focus files, including `../` → `422`, and nothing is stored
- [ ] `PATCH /api/tasks/{id}/status` to `SUBMITTED` → `422`
- [ ] A file over 64 KB → `422`

### Quality
- [ ] Backend and frontend coverage ≥ 80% lines and branches
- [ ] Every seed task has focus files, checked by trying at least 3 of the rewritten ones on staging
- [ ] Screens 5, 6a and 6b compared with Figma at 1440×900 and checked at 1280 wide

---

## Definition of Done

Every box is ticked, ROADMAP Phase 4 is checked off, and the result is recorded here.
