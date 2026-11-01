# P7-01 — Static Room Scene & Avatar Placeholder

**Phase:** 7 — Game Shell  
**Status:** ✅ Complete  
**Depends on:** P2-04  

---

## Goal

Replace the plain "Welcome to the Game Room" page with a static isometric developer room that reads as a game, with clickable objects as entry points to each panel.

---

## Acceptance Criteria

- [x] `game/RoomScene.tsx`: inline SVG isometric room (floor, two walls, desk, monitor, chair, a wall-mounted kanban board, a door)
- [x] Avatar placeholder (simple SVG figure) seated at the desk
- [x] Hotspots are real `<button>`s (or SVG elements with `role="button"`, `tabIndex`, `aria-label`) with a visible hover/focus state:
  - Kanban board → Task Board
  - Monitor → Codebase Explorer (Phase 3) / Editor (Phase 4)
  - Door → End of Day (P7-05)
- [x] A slim HUD strip shows the player's email/profile link and log out (moved from the current page)
- [x] Room colours are new semantic tokens in `styles/tokens.css` (e.g. `--color-room-floor`, `--color-room-wall`); no raw palette values in components
- [x] `GameRoomPage` keeps its existing "no profile → onboarding" redirect
- [x] Hotspots for panels that don't exist yet are hidden or disabled with a tooltip, never broken links

---

## Implementation Notes

- No game engine or sprite sheets for MVP (ROADMAP). Hand-built SVG keeps the bundle small and scales cleanly.
- Keep the SVG in its own component so it can later be swapped for an animated version (post-MVP backlog) without touching navigation.

---

## File Locations

```
frontend/src/
├── game/RoomScene.tsx
├── game/Avatar.tsx
├── pages/GameRoomPage.tsx   ← updated
└── styles/tokens.css        ← updated
```

---

## Definition of Done

`npm run build` and `npm run lint` pass; the room renders at 1280px+ with keyboard-reachable hotspots.
