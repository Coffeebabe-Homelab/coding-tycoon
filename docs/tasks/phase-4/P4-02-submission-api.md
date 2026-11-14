# P4-02 — Submission Domain & API

**Phase:** 4 — Code Editor & VCS Panel  
**Status:** ⬜ Not started  
**Depends on:** none (P4-01 only changes content)  

---

## Goal

Store a push: the files the player changed and a commit message. A push moves the task to `SUBMITTED`, and it is the only way to get there.

---

## Acceptance Criteria

- [ ] New `submission` package following the SPEC layering: `Submission` entity, `SubmissionRepository` (port) with a JPA adapter, `SubmissionService`, `SubmissionResource`
- [ ] Flyway `V10`: a `submissions` table (`id`, `task_id`, `player_profile_id`, `attempt_number`, `commit_message`, `submitted_at` in UTC) and a `submission_files` table (`submission_id`, `path`, `content`)
- [ ] `POST /api/submissions` with `{ "commitMessage": "...", "files": [{ "path": "...", "content": "..." }] }` returns `201` with the stored submission
- [ ] Validation, with `422` and a clear message for each:
  - the player has an active task in `IN_PROGRESS` or `CHANGES_REQUESTED`
  - `files` isn't empty, has no duplicate paths, and every path is one of the task's focus files
  - each file differs from the codebase original, and none is over 64 KB
  - `commitMessage` isn't blank and is at most 72 characters
- [ ] In one transaction: the submission is saved with `attemptNumber` = previous submissions for the task + 1, and the task moves to `SUBMITTED`
- [ ] `GET /api/submissions/latest` returns the latest submission for the active task, with its files, or `204` when there's none
- [ ] `PATCH /api/tasks/{id}/status` no longer accepts `→ SUBMITTED`, so a push is the only way to submit. `ASSIGNED → IN_PROGRESS` stays
- [ ] Both endpoints need authentication (`401` without a token) and only use the caller's own task
- [ ] Tests: service unit tests with Mockito covering each validation and the attempt counter; resource tests for 201, 204, 401 and 422; a test that the status PATCH now rejects `SUBMITTED`
- [ ] ≥ 80% line and branch coverage on `submission`
- [ ] `backend/SPEC.md`: API table, data model, and the player transitions line

---

## Implementation Notes

- The roadmap's `GET /api/submissions/template` isn't needed. The editor reads originals through the existing `GET /api/codebase/files/{path}`, and `GET /api/submissions/latest` restores pushed work after a refresh. Phase 5 uses it again for "Fix in editor".
- Store full file contents, not a diff. Phase 5's reviewer needs the whole file, and the diff is shown in the browser (P4-04).
- Read originals with `CodebaseRepository`, so the "differs from original" check uses the same allow-list as the explorer.
- `Task` has no "submitted" relation. Keep the link one way, from `Submission` to `taskId`, like `XpEvent`.
- Nothing reviews the push until Phase 5, so the task stays `SUBMITTED`. That is the designed "waiting for review" state (Screen 6b).

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/submission/
backend/src/main/resources/db/migration/V10__create_submissions.sql
backend/src/main/java/dev/codingtycoon/task/TaskService.java   (player transitions)
```

---

## Definition of Done

`./mvnw verify` passes with coverage thresholds met, and a push from `curl` moves the task to `SUBMITTED`.
