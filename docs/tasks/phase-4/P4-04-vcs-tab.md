# P4-04 — VCS Tab: Diff, Commit & Push

**Phase:** 4 — Code Editor & VCS Panel  
**Status:** ✅ Complete (2026-11-14)  
**Depends on:** P4-02, P4-03  

---

## Goal

The player sees what they changed, writes a commit message and pushes. The push stores a submission and moves the task to `SUBMITTED`.

**Figma:** Screens 6a (32:478) and 6b (32:1041). Components: Input (multi-line), Toast, Modal, File Tree Row.

---

## Acceptance Criteria

### Route
- [x] `/room/vcs` is a `PanelWindow` tab after Editor, with breadcrumb "Room / VCS"

### Commit & push (6a)
- [x] Sidebar: a branch label made from the task (for example `feat/task-12-list-users`), "Changes · N", and one row per changed file with its `M` tag
- [x] The selected file's diff is shown in Monaco's read-only diff editor, themed with the Night Shift tokens, with a Unified/Split toggle (unified by default)
- [x] "Open in editor" opens the Editor tab on that file
- [x] Commit message is a multi-line `Input` with a character counter against the 72-character limit
- [x] "Commit & push for review" is disabled with no changes or no message. It asks "Push to review?" in a Modal, then calls `POST /api/submissions`
- [x] The footer shows the file count and attempt number

### Pushed (6b)
- [x] After a push, or on reload while the task is `SUBMITTED`, the panel shows the latest submission: "Last push", the files, the commit message read-only, a disabled "Pushed · waiting for review" button and when it was pushed
- [x] A Toast confirms the push. Phase 4 has no reviewer, so it says the push is waiting for review and doesn't claim the AI is reviewing. Phase 5 changes the wording
- [x] A failed push keeps the drafts and the message and shows the server's error

### States, tests and docs
- [x] No changes: an empty state pointing to the Editor
- [x] Tests: changed-file list; disabled push; confirm then push; the request body; the pushed state, including after reload; error kept; Unified/Split toggle
- [x] In a real browser: the diff theme, the toggle, and keyboard-only commit and push
- [x] `frontend/SPEC.md`: route, components

---

## Implementation Notes

- The changed-file list compares each draft with its original as text. The diff editor only renders the selected file.
- Per-file +/− counts (Figma "+15 −1") come from the diff editor's line changes. Show them for the selected file, and list rows show only the `M` tag unless counting every file turns out cheap.
- Use one Monaco diff editor and swap its models, rather than one per file.
- The branch label is only text for the game. There's no real Git.

## Result

- Done as specified. Checked in a browser against a stubbed API: the diff theme, Unified/Split, "Open in editor", keyboard-only commit and push (the Modal starts on Cancel), the toast, focus moving to "Last push", and the Editor becoming read-only. The browser run pushed one file; two files and the pushed state after a reload are covered by tests. P4-05 checks both against the real backend.
- `commitHash` is decorative: the first 7 hex characters of MD5(`taskId:playerProfileId:attemptNumber`), added to the submission response. Nothing is stored.
- The Toast host lives in `GameShell` (`ToastProvider`), so a toast survives a tab switch. A success toast closes after 6 s; an error toast waits for Dismiss. A failed push shows the server's message inline under the button rather than as a toast. There is no "Pushing…" toast; the button says "Pushing…" instead.
- +/− counts are shown for the selected file only. List rows show just the `M` tag.
- "Open in editor" uses `/room/editor?file=<path>`.
- Fixed on the way:
  - Typing right after switching files in the Editor could land in the previous file. The Editor now keeps the selected file in local state and mirrors it to the URL, because router updates are transitions and can lag.
  - A Monaco editor that reuses a kept model (each tab hide replaces the editor) showed the content from before the hide. Both editors now bring the model up to date on mount, reading the current props through a ref, because the wrapper keeps the `onMount` from its first render.

---

## File Locations

```
frontend/src/pages/VcsPage.tsx
frontend/src/components/{DiffView,Input,Toast}.tsx
frontend/src/hooks/useSubmission.ts
frontend/src/components/PanelWindow.tsx, frontend/src/App.tsx
```

---

## Definition of Done

Tests, coverage, lint and build pass, and a player can push two changed files, see the pushed state, and still see it after a refresh.
