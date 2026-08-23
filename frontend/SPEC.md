# Frontend Specification — Coding Tycoon

> Authoritative technical reference for the frontend. Read before any frontend work.
> Update this document whenever routing, architecture, or component structure changes.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React 18 + TypeScript (strict mode) |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (Vite plugin) |
| Code editor | Monaco Editor |
| Auth | `@auth0/auth0-react` |
| State (client) | Zustand |
| State (server) | TBD — React Query or SWR |
| Linting | ESLint + typescript-eslint + react-hooks |
| Formatting | Prettier |

---

## Application Structure

```
frontend/src/
├── components/    Reusable UI primitives (Button, Card, Modal, FileTree, Badge, ...)
├── pages/         Route-level page components
├── game/          Game-specific UI (room scene, session flow, avatar)
├── hooks/         Custom React hooks (useTask, useReview, useProfile, ...)
├── lib/           Pure utilities
│   ├── api.ts         fetchWithAuth helper
│   ├── auth.ts        Auth0 helpers
│   └── diff.ts        Diff computation utilities
├── store/         Zustand stores
│   ├── gameStore.ts   Session state, current room mode
│   └── profileStore.ts Player profile cache
├── types/         Shared TypeScript interfaces and enums
└── assets/        Static files (images, SVGs, fonts)
```

---

## Routing

```
/                   → redirect: unauthenticated → /login, authenticated → /room
/login              → LoginPage (public)
/callback           → Auth0 callback handler
/room               → GameRoomPage (protected) — main hub
/room/task          → TaskBoardPage (protected)
/room/editor        → EditorPage (protected)
/room/review        → ReviewPage (protected)
/profile            → ProfilePage (protected)
```

All routes under `/room` and `/profile` are wrapped in `<ProtectedRoute />`.

---

## State Management Rules

| Data type | Where it lives | Why |
|---|---|---|
| Task, review, profile data | React hook + `useState` (or React Query) | Server-owned, stale-able |
| Current session mode (which panel is open) | Zustand `gameStore` | Shared across unrelated components |
| Player profile cache | Zustand `profileStore` | Needed in multiple panels |
| Form values, toggles, local UI | `useState` | No cross-component sharing needed |

Never duplicate server data in Zustand. Zustand stores are for client-side UI state only.

---

## API Integration Pattern

Always use the `fetchWithAuth` helper. Never write raw `fetch` with `Authorization` headers in components.

```ts
// lib/api.ts
export const fetchWithAuth = async <T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<T>
}
```

Retrieve the token in hooks, not in components:

```ts
const { getAccessTokenSilently } = useAuth0()
const token = await getAccessTokenSilently()
```

---

## Tailwind CSS Conventions

The game palette maps to Tailwind's built-in slate/gray/purple classes:

| Role | Class |
|---|---|
| Background (room) | `bg-gray-950` |
| Panel background | `bg-gray-900` |
| Panel border | `border-gray-700` |
| Primary accent | `text-purple-400` / `bg-purple-600` |
| Success | `text-green-400` |
| Warning | `text-yellow-400` |
| Danger | `text-red-400` |
| Body text | `text-gray-200` |
| Muted text | `text-gray-400` |

Spacing: use the 4-point scale (`p-4`, `gap-4`, `m-2`) consistently. Avoid arbitrary values (`p-[13px]`) unless strictly necessary.

Component class patterns:
- Panels: `rounded-xl border border-gray-700 bg-gray-900 p-4`
- Primary button: `rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-500`
- Badge: `rounded-full bg-purple-900/50 px-2 py-0.5 text-xs text-purple-300`

---

## Monaco Editor Integration

```tsx
import Editor from '@monaco-editor/react'

<Editor
  height="100%"
  language="java"
  theme="vs-dark"
  value={code}
  onChange={(val) => setCode(val ?? '')}
  options={{
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    readOnly: false,   // true for codebase explorer
  }}
/>
```

For the **Codebase Explorer** (read-only): set `readOnly: true` and `domReadOnly: true`.
For the **Editor panel**: allow edits, bind value to component state, surface changes via `onChange`.

---

## Auth0 Integration

```tsx
// main.tsx
<Auth0Provider
  domain={import.meta.env.VITE_AUTH0_DOMAIN}
  clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
  authorizationParams={{
    redirect_uri: `${window.location.origin}/callback`,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  }}
>
  <App />
</Auth0Provider>
```

```tsx
// components/ProtectedRoute.tsx
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) {
    loginWithRedirect()
    return null
  }
  return <>{children}</>
}
```

Use `getAccessTokenSilently()` to retrieve the access token — always in hooks or `useEffect`, never at render time.

---

## Testing

### Tools

- **Vitest** — unit tests for hooks and utilities
- **React Testing Library** — component tests
- **jsdom** — DOM environment for Vitest

### What to test

- Hooks: data transformation, error states, loading states
- Utilities: `lib/` functions — pure functions are easy to test exhaustively
- Components: render output, user interactions (click, type, submit), accessibility

### What not to test

- Implementation details (internal state variable names, child component props)
- Styling classes — test behaviour, not appearance
- Third-party library internals (Monaco, Auth0 SDK)

### Patterns

```tsx
// Component test example
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('shows task title', () => {
  render(<TaskCard title="Add REST endpoint" />)
  expect(screen.getByText('Add REST endpoint')).toBeInTheDocument()
})
```

---

## Accessibility Baseline

- All interactive elements must be keyboard-accessible (focusable, `Enter`/`Space` triggers action)
- ARIA roles for game panels: `role="dialog"` for overlays, `aria-label` on icon-only buttons
- Colour contrast: minimum 4.5:1 for body text (Tailwind gray-200 on gray-900 meets this)
- Images need `alt` text; decorative images use `alt=""`
- Monaco Editor: the editor container must have an `aria-label`
