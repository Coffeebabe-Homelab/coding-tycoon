# P7-02 — Room as Hub: Overlay Navigation & Session Flow

**Phase:** 7 — Game Shell  
**Status:** 🔲 Not started  
**Depends on:** P7-01  

---

## Goal

Make the room the hub: panels (Task Board, Codebase Explorer, Profile) open as overlays on top of the room instead of separate pages, and the day follows a guided flow.

---

## Decision (confirmed 2026-11-01): option A, nested routes

| Option | Pros | Cons |
|---|---|---|
| **A. Nested routes** (`/room` renders the scene + `<Outlet />`; `/room/task` etc. render inside an overlay) *(recommended)* | No new dependency; existing URLs keep working; browser back button closes the panel; deep links and refresh work | Overlay state is tied to the URL (fine for panels) |
| B. Zustand `gameStore` (earlier SPEC sketch, rejected) | Any component can open a panel without routing | New dependency; back button and refresh lose the open panel unless synced to the URL manually |

Recorded in `frontend/SPEC.md` (routing + state management). Zustand is not adopted.

---

## Acceptance Criteria

- [ ] `components/Overlay.tsx`: accessible modal panel (focus trap, `Esc` and a close button return to `/room`, `aria-modal`, labelled heading)
- [ ] Task Board, Codebase Explorer (if P3-05 has landed) and Profile render as overlays over the room
- [ ] Session flow: after login → room; if today's task is `ASSIGNED`, the Task Board opens automatically once per session
- [ ] Flow placeholders for later phases (Editor, Review) are not linked until they exist
- [ ] Desktop-first layout: no horizontal scroll at 1280px width; the room scales to fill larger screens
- [ ] Existing protected-route behaviour unchanged (unauthenticated → login)

---

## Implementation Notes

- Below 1280px, just don't break. The "best on desktop" warning screen is Phase 8.
- P3-05 edits the same routes and room page; whichever task lands second wires the explorer into the overlay.

---

## File Locations

```
frontend/src/
├── components/Overlay.tsx
├── pages/GameRoomPage.tsx   ← updated
├── pages/TaskBoardPage.tsx  ← updated (overlay-friendly layout)
├── pages/ProfilePage.tsx    ← updated
└── App.tsx                  ← updated (nested routes under /room)
```

---

## Definition of Done

`npm run build` and `npm run lint` pass; panels open over the room, close with Esc/back, and survive a page refresh.
