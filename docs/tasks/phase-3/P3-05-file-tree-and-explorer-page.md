# P3-05 — File Tree & Codebase Explorer Page

**Phase:** 3 — Codebase Explorer  
**Status:** ✅ Complete  
**Depends on:** P3-02, P3-03, P3-04  

---

## Goal

Let the player browse the task's codebase: a collapsible file tree on the left, the read-only `CodeEditor` on the right.

---

## Acceptance Criteria

- [x] `types/codebase.ts`: `CodebaseFiles` and `CodebaseFile` interfaces matching the P3-02 responses
- [x] `lib/fileTree.ts`: `buildFileTree(paths)` turns the flat path list into a nested, sorted tree (folders first)
- [x] `hooks/useCodebase.ts`: loads the file list once; `openFile(path)` fetches content via `fetchWithAuth`; exposes `{ files, focusFiles, openFile, current, isLoading, error }`
- [x] `components/FileTree.tsx`: collapsible folders, file icons by type (inline SVG or text glyph, no icon library), keyboard accessible, focus files highlighted
- [x] `pages/CodebaseExplorerPage.tsx` at `/room/codebase` (protected): tree + `CodeEditor` with `readOnly`
- [x] Opens the first focus file by default; `?file=<path>` selects a specific file (deep link)
- [x] Loading and error states follow existing patterns (`text-danger` for errors); "no active task" shows a friendly message with a link to the task board
- [x] Task Board shows the task's focus files as links into the explorer, plus an "Explore codebase" link
- [x] Room page links to the explorer (P7-02 turns it into an overlay; whichever lands second wires it up)
- [x] Semantic design tokens only, no raw palette classes

---

## File Locations

```
frontend/src/
├── types/codebase.ts
├── lib/fileTree.ts
├── hooks/useCodebase.ts
├── components/FileTree.tsx
├── pages/CodebaseExplorerPage.tsx
├── pages/TaskBoardPage.tsx    ← updated
├── pages/GameRoomPage.tsx     ← updated
└── App.tsx                    ← updated
```

---

## Definition of Done

`npm run build` and `npm run lint` pass; against a running backend, the tree renders, files open with syntax highlighting, and nothing can be edited.
