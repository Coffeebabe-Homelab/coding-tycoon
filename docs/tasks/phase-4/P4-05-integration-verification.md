# P4-05 — Phase 4 Integration Verification

**Phase:** 4 — Code Editor & VCS Panel  
**Status:** ✅ Complete (2026-11-14)  
**Depends on:** P4-01 through P4-04  

---

## Goal

Verify the Phase 4 exit criteria end to end, locally and on staging, before closing the phase.

---

## Exit Criteria (from ROADMAP)

### Editor
- [x] A new task opens in the Editor with its focus files, each starting from the codebase original
- [x] Edits survive tab switches, closing the panel and a Profile visit
- [x] Keyboard only: Tab leaves the editor with Ctrl/Cmd+M; Esc inside the editor doesn't close the panel

### Push
- [x] The VCS tab lists the changed files and shows their diff, in Unified and Split
- [x] Commit message plus confirm pushes the submission; the task is `SUBMITTED` in the database with attempt 1
- [x] After a refresh, the Editor is read-only and VCS shows the pushed state

### Security checks
- [x] `POST /api/submissions` without a token → `401`
- [x] A path outside the task's focus files, including `../` → `422`, and nothing is stored
- [x] `PATCH /api/tasks/{id}/status` to `SUBMITTED` → `422`
- [x] A file over 64 KB → `422`

### Quality
- [x] Backend and frontend coverage ≥ 80% lines and branches
- [x] Every seed task has focus files, checked by trying at least 3 of the rewritten ones on staging
- [x] Screens 5, 6a and 6b compared with Figma at 1440×900 and checked at 1280 wide

---

## Definition of Done

Every box is ticked, ROADMAP Phase 4 is checked off, and the result is recorded here.

---

## Result

Verified on staging (`https://coding-tycoon-stg.tail028aa9.ts.net`) by the owner on 2026-11-14, after a fresh database (all Flyway migrations from empty) and with P1-08 deployed. Every check above passed.

- Editor, push and refresh checks: walked through in the browser on staging.
- Security: `401` without a token checked on staging. The `422` cases are also covered by `SubmissionResourceTest` and `SubmissionServiceTest` (foreign path, `../` path, second push, file over 64 KB, PATCH to `SUBMITTED`).
- Seed tasks: three rewritten tasks played on staging, resetting the active task between runs; each opened with its focus files.
- Coverage: frontend 99.16% statements and 96.44% branches (378 tests); backend 99% instructions and 97% branches, JaCoCo gate green.
- Figma: Screens 5, 6a and 6b compared at 1440×900 and checked at 1280.
- Found along the way: `users.email` was never stored, fixed in P1-08 (PR #52).
