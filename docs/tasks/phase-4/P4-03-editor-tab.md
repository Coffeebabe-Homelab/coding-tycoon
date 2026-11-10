# P4-03 — Editor Tab

**Phase:** 4 — Code Editor & VCS Panel  
**Status:** ⬜ Not started  
**Depends on:** P4-02 for `GET /api/submissions/latest` (can start on a mock)  

---

## Goal

The player edits the active task's focus files in Monaco, inside the panel window, without losing work when they switch tabs or close the panel.

**Figma:** Screen 5, frame 30:418. Components: Editor Tab, Criteria Item, Modal.

---

## Acceptance Criteria

### Route and entry
- [ ] `/room/editor` is a `PanelWindow` tab between Codebase and VCS, with breadcrumb "Room / Editor"
- [ ] Task Board's disabled "Continue" button on an `IN_PROGRESS` task becomes a link to the Editor

### Layout (Screen 5)
- [ ] Ticket sidebar: title, `Difficulty`, `StatusBadge`, description and the acceptance criteria as a read-only list
- [ ] One Editor Tab per focus file, then a path breadcrumb and an editable `CodeEditor` for the selected file
- [ ] "Reset file" restores the original after a confirm Modal, because it discards work
- [ ] "Review changes" opens the VCS tab, and is disabled while nothing has changed
- [ ] Status bar: language, cursor line and column, and the number of changed files

### Drafts
- [ ] Each file starts from the latest submission's version if there is one, otherwise from the codebase original
- [ ] Drafts survive tab switches, closing and reopening the panel, and a Profile visit. Surviving a refresh is out of scope ([backlog card](https://trello.com/c/ylqNEdV2))
- [ ] Drafts live in a `DraftsProvider` context in `GameShell`, so the VCS tab reads the same drafts. No global store

### States
- [ ] `SUBMITTED`: files are read-only, Editor Tabs show the lock icon, and a note says the push is waiting for review
- [ ] `ASSIGNED`: a prompt to start the task from the Task Board
- [ ] No active task, or a task without focus files: an empty state with a link to the Codebase Explorer

### Keyboard
- [ ] Esc while focus is inside Monaco goes to Monaco (for example to close its suggestions) and doesn't close the panel. Esc anywhere else still closes it
- [ ] Tab can leave the editor: Monaco's Ctrl+M (Cmd+M on Mac) "Tab moves focus" toggle works, and the status bar names the shortcut
- [ ] Focus never lands on `<body>` after Reset or a tab change

### Tests and docs
- [ ] Tests: tab and breadcrumb; draft kept across tab switch and close/reopen; starting from the latest submission; reset after confirm; read-only when `SUBMITTED`; each empty state; Esc inside the editor doesn't navigate
- [ ] In a real browser: typing, Tab-out, Esc, and that Monaco still works after being hidden and shown (`<Activity>`)
- [ ] `frontend/SPEC.md`: routing table, shell components, the Esc rule

---

## Implementation Notes

- Reuse `CodeEditor` from Phase 3 with `readOnly={false}`, one Monaco model per file, so undo history is per file and survives tab changes.
- `useModalDialog` handles Esc on `document`. Skip it when the event comes from inside `.monaco-editor` or was already handled (`defaultPrevented`).
- Left out on purpose: the "Auto-saved" label (backlog card), the senior-dev tip card (no data until Phase 5), Criteria Item checkboxes (nothing decides when a criterion is met), and gutter change markers. Add the markers only if Monaco's dirty-diff decorations are cheap.
- Build Editor Tab and Criteria Item as components on first use, per the design plan.

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
