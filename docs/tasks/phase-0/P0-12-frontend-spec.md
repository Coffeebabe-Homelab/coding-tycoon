# P0-12 — Frontend SPEC.md

**Phase:** 0 — Foundation  
**Status:** 🔲 Not started  
**Depends on:** P0-01, P0-10  

---

## Goal

Write `frontend/SPEC.md` — the authoritative technical specification for the frontend. Guides every developer (and AI tooling) working on the React app.

---

## Acceptance Criteria

- [ ] `frontend/SPEC.md` exists
- [ ] Application architecture documented: routing structure, page map, component hierarchy
- [ ] State management documented: what lives in Zustand/Redux vs local React state; rules for when to use each
- [ ] API integration pattern: how to call the backend (auth token injection, error handling, loading states)
- [ ] Tailwind CSS conventions: spacing scale, colour tokens used in the game, component naming rules
- [ ] Monaco Editor integration: how to mount, configure, handle value changes, set language
- [ ] Auth0 integration: `useAuth0` hook usage, `ProtectedRoute`, token retrieval pattern
- [ ] Folder structure documented with purpose of each directory
- [ ] Accessibility baseline: minimum ARIA requirements, keyboard navigation expectations
- [ ] Testing approach: React Testing Library conventions, what to test vs what not to test in UI components

---

## Content Outline

```
# Frontend Specification — Coding Tycoon

## Tech Stack
[React 18, TypeScript (strict), Vite, Tailwind CSS, Monaco Editor, Auth0 React SDK]

## Application Structure
frontend/src/
├── components/    — Reusable UI components (Button, Card, Modal, FileTree, ...)
├── pages/         — Route-level page components (LoginPage, GameRoomPage, TaskBoardPage, ...)
├── game/          — Game-specific UI (room scene, avatar, session flow)
├── hooks/         — Custom React hooks (useTask, useReview, useProfile, ...)
├── lib/           — Utilities (api.ts, auth.ts, diff.ts)
├── store/         — Zustand stores (gameStore, profileStore)
├── types/         — Shared TypeScript types and interfaces
└── assets/        — Static assets (images, SVGs, fonts)

## Routing
/ → redirect based on auth state
/login → LoginPage (public)
/callback → Auth0 callback handler
/room → GameRoomPage (protected) — main hub
/room/task → TaskBoardPage (protected)
/room/editor → EditorPage (protected)
/room/review → ReviewPage (protected)
/profile → ProfilePage (protected)

## State Management
[Rules: server state in React Query or SWR vs client state in Zustand]

## API Integration Pattern
[useAuth0 token → fetchWithAuth helper → typed response handling]

## Tailwind Conventions
[Colour palette mapping to game theme, spacing rules, component class patterns]

## Monaco Editor
[Setup, language config, value binding, read-only mode for codebase explorer]

## Auth0 Integration
[Provider setup, ProtectedRoute, token retrieval]

## Testing
[RTL conventions, what to unit test, what to integration test]

## Accessibility
[ARIA roles for game panels, keyboard navigation for editor]
```

---

## Definition of Done

- Document exists and covers all sections. Reviewed before any Phase 1 frontend work begins. Treated as a living document — updated when architecture changes.
