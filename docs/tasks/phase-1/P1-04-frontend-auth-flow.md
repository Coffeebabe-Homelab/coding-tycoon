# P1-04 — Frontend Auth Flow: Login, Logout & Protected Routes

**Phase:** 1 — Auth & Player Profile  
**Status:** 🔲 Not started  
**Depends on:** P0-06 (Auth0 SDK configured in frontend)  

---

## Goal

Harden the Auth0 login/logout flow that was scaffolded in Phase 0. The current `App.tsx` has a working skeleton — this task cleans it up into production-quality pages, moves page components to their own files under `pages/`, and ensures the routing structure from `frontend/SPEC.md` is correctly in place.

---

## What we're building — frontend context

> **For the frontend learner:** React apps are made of components (reusable UI building blocks) arranged in a tree. Routing means "show a different component based on the URL". React Router is the library we use for that.
>
> Right now all our pages are in one big `App.tsx` file — that's fine for a prototype but hard to maintain. This task splits each page into its own file and makes the routing explicit and clean.
>
> The `ProtectedRoute` component is a wrapper: if you're not logged in, it redirects you to Auth0. If you are logged in, it renders whatever is inside it. You'll see this pattern a lot in React apps.

---

## Acceptance Criteria

- [ ] `src/pages/LoginPage.tsx` extracted from `App.tsx` into its own file
- [ ] `src/pages/CallbackPage.tsx` extracted from `App.tsx` into its own file
- [ ] `src/pages/GameRoomPage.tsx` extracted from `App.tsx` into its own file (placeholder content for now)
- [ ] `src/pages/ProfilePage.tsx` created as an empty placeholder with routing wired
- [ ] Routing in `App.tsx` matches the spec: `/`, `/login`, `/callback`, `/room`, `/profile`
- [ ] `ProtectedRoute` component moved to `src/components/ProtectedRoute.tsx` (already there — verify it's correct)
- [ ] Login page has a clean styled layout (dark background, centred card, logo/title, login button)
- [ ] Logout button visible on `GameRoomPage`
- [ ] Loading states shown while Auth0 is determining authentication status
- [ ] `npm run build` and `npm run lint` pass with zero errors

---

## Implementation Notes

### Pages to create/extract

```
src/pages/
├── LoginPage.tsx       ← centred card: "Coding Tycoon" title + "Log in" button
├── CallbackPage.tsx    ← spinner while Auth0 processes the callback
├── GameRoomPage.tsx    ← placeholder: welcome message + logout button
└── ProfilePage.tsx     ← placeholder: "Profile — coming soon"
```

### App.tsx after this task

```tsx
// App.tsx — routing only, no inline page content
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import CallbackPage from './pages/CallbackPage'
import GameRoomPage from './pages/GameRoomPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/room" element={<ProtectedRoute><GameRoomPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={isAuthenticated ? '/room' : '/login'} replace />} />
    </Routes>
  )
}
```

### LoginPage layout (Tailwind)

```tsx
// pages/LoginPage.tsx
export default function LoginPage() {
  const { loginWithRedirect } = useAuth0()
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-gray-700 bg-gray-900 p-10">
        <h1 className="text-3xl font-bold text-white">Coding Tycoon</h1>
        <p className="text-sm text-gray-400">Learn real developer skills. One day at a time.</p>
        <button
          className="rounded-lg bg-purple-600 px-6 py-2 text-white hover:bg-purple-500"
          onClick={() => loginWithRedirect()}
        >
          Log in
        </button>
      </div>
    </div>
  )
}
```

### Remove dev-only token logging

The `useEffect` in `App.tsx` that logs the access token to the console was marked "DEV ONLY — remove before Phase 1 ships". Remove it in this task.

---

## File Locations

```
frontend/src/
├── App.tsx                          ← routing only
├── components/
│   └── ProtectedRoute.tsx           ← already exists, verify correctness
└── pages/
    ├── LoginPage.tsx
    ├── CallbackPage.tsx
    ├── GameRoomPage.tsx
    └── ProfilePage.tsx
```

---

## Definition of Done

- All routes resolve correctly. Login → callback → room works end-to-end. Unauthenticated access to `/room` redirects to Auth0. `npm run build` and `npm run lint` pass.
