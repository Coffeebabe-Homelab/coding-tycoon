# P4-03 — Editor Tab

**Phase:** 4 — Code Editor & VCS Panel  
**Status:** ✅ Complete (2026-11-14)  
**Depends on:** P4-02 for `GET /api/submissions/latest` (can start on a mock)  

---

## Goal

The player edits the active task's focus files in Monaco, inside the panel window, without losing work when they switch tabs or close the panel.

**Figma:** Screen 5, frame 30:418. Components: Editor Tab, Criteria Item, Modal.

---

## Acceptance Criteria

### Route and entry
- [x] `/room/editor` is a `PanelWindow` tab between Codebase and VCS, with breadcrumb "Room / Editor"
- [x] Task Board's disabled "Continue" button on an `IN_PROGRESS` task becomes a link to the Editor

### Layout (Screen 5)
- [x] Ticket sidebar: title, `Difficulty`, `StatusBadge`, description and the acceptance criteria as a read-only list
- [x] One Editor Tab per focus file, then a path breadcrumb and an editable `CodeEditor` for the selected file
- [x] "Reset file" restores the original after a confirm Modal, because it discards work
- [x] "Review changes" opens the VCS tab, and is disabled while nothing has changed
- [x] Status bar: language, cursor line and column, and the number of changed files

### Drafts
- [x] Each file starts from the latest submission's version if there is one, otherwise from the codebase original
- [x] Drafts survive tab switches, closing and reopening the panel, and a Profile visit. Surviving a refresh is out of scope ([backlog card](https://trello.com/c/ylqNEdV2))
- [x] Drafts live in a `DraftsProvider` context in `GameShell`, so the VCS tab reads the same drafts. No global store

### States
- [x] `SUBMITTED`: files are read-only, Editor Tabs show the lock icon, and a note says the push is waiting for review
- [x] `ASSIGNED`: a prompt to start the task from the Task Board
- [x] No active task, or a task without focus files: an empty state with a link to the Codebase Explorer

### Keyboard
- [x] Esc while focus is inside Monaco goes to Monaco (for example to close its suggestions) and doesn't close the panel. Esc anywhere else still closes it
- [x] Tab can leave the editor: Monaco's Ctrl+M (Ctrl+Shift+M on Mac) "Tab moves focus" toggle works, and the status bar names the shortcut
- [x] Focus never lands on `<body>` after Reset or a tab change

### Tests and docs
- [x] Tests: tab and breadcrumb; draft kept across tab switch and close/reopen; starting from the latest submission; reset after confirm; read-only when `SUBMITTED`; each empty state; Esc inside the editor doesn't navigate
- [x] In a real browser: typing, Tab-out, Esc, and that Monaco still works after being hidden and shown (`<Activity>`)
- [x] `frontend/SPEC.md`: routing table, shell components, the Esc rule

---

## Implementation Notes

- Reuse `CodeEditor` from Phase 3 with `readOnly={false}`, one Monaco model per file, so undo history is per file and survives tab changes.
- `useModalDialog` handles Esc on `document`. Skip it when the event comes from inside `.monaco-editor` or was already handled (`defaultPrevented`).
- Left out on purpose: the "Auto-saved" label (backlog card), the senior-dev tip card (no data until Phase 5), Criteria Item checkboxes (nothing decides when a criterion is met), and gutter change markers. Add the markers only if Monaco's dirty-diff decorations are cheap.
- Build Editor Tab and Criteria Item as components on first use, per the design plan.

---

## Result

- Done as specified, checked in a browser: typing, Esc inside Monaco (panel stays open), Ctrl+Shift+M then Tab leaves the editor, drafts and undo history survive a Codebase visit and closing the panel, Reset through the Modal, read-only when `SUBMITTED`.
- On a Mac the toggle is Ctrl+Shift+M, Monaco's own binding. Cmd+M, as first written here, minimises the window.
- "Review changes" links to `/room/vcs`, which P4-04 adds. Until then the link leads to an empty page, so deploy P4-03 together with P4-04.
- Left out of the Figma Editor Tab: the × (focus files can't be closed) and the file-type icon (the Java icon is filled, and `Icon` only draws strokes). The Modal has no Figma component node; it reuses the `Overlay` surface and `shadow-overlay`.
- Also fixed on the way: `fetchWithAuth` now resolves to `undefined` on a 204 ([card](https://trello.com/c/d6v9NYfk), which stays open for its other items).

---

## File Locations

```
frontend/src/pages/EditorPage.tsx
frontend/src/components/{EditorTab,CriteriaItem,Modal}.tsx
frontend/src/hooks/useDrafts.tsx   (DraftsProvider + hook)
frontend/src/hooks/useModalDialog.ts
frontend/src/components/PanelWindow.tsx, frontend/src/App.tsx
```

---

## Definition of Done

Tests, coverage, lint and build pass, and a keyboard-only player can edit two focus files, switch tabs, close the panel and come back to the same drafts.
