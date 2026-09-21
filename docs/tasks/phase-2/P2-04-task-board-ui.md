# P2-04 — Task Board UI

**Phase:** 2 — Task Engine  
**Status:** ✅ Complete  
**Depends on:** P2-03 (task API endpoints), P1-04 (auth flow)  

---

## Goal

Build the Task Board page where the player sees their daily task, and wire up the "Start task" interaction via the state machine API.

---

## Acceptance Criteria

- [x] `Task` TypeScript interface and `TaskStatus` union type in `src/types/task.ts`
- [x] `useTask` hook: fetches `GET /api/tasks/today` via `fetchWithAuth`; exposes `{ task, isLoading, error, startTask }`
- [x] `startTask()` calls `PATCH /api/tasks/{id}/status` and updates local state on success
- [x] `TaskBoardPage` displays: title, difficulty badge, tags as chips, description, acceptance criteria bullet list
- [x] "Start task" button shown when `status === ASSIGNED`; "Continue" button shown when `IN_PROGRESS`
- [x] Loading state (spinner) while fetching
- [x] Error state rendered with `text-danger` class
- [x] `GameRoomPage` has a prominent "View today's task" link to `/room/task`
- [x] Route `/room/task` added to `App.tsx` wrapped in `ProtectedRoute`
- [x] All Tailwind classes use semantic design tokens (no raw palette classes)

---

## Semantic Token Mapping

| Use | Token |
|---|---|
| Background base | `bg-bg-base` |
| Surface card | `bg-bg-surface` |
| Elevated element | `bg-bg-elevated` |
| Border | `border-border` |
| Primary text | `text-text-primary` |
| Muted text | `text-text-muted` |
| Accent | `bg-accent` / `hover:bg-accent-hover` |
| Accent subtle | `bg-accent-subtle` / `text-accent-hover` |

---

## File Locations

```
frontend/src/
├── types/task.ts
├── hooks/useTask.ts
├── pages/TaskBoardPage.tsx
├── pages/GameRoomPage.tsx      ← updated
└── App.tsx                     ← updated
```

---

## Definition of Done

`npm run build` and `npm run lint` both pass with 0 errors. No raw palette classes in new files. Task board renders correctly with mock auth token.
