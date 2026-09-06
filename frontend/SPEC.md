# Frontend Specification — Coding Tycoon

> Authoritative technical reference for the frontend. Read before any frontend work.
> Update this document whenever routing, architecture, or component structure changes.

---

## Learning Context

The frontend is being built by someone learning frontend design and development from the ground up. This shapes how we work:

- Every frontend decision will be explained **before** implementation: what we're building, why this approach, and what the trade-offs are versus alternatives.
- Patterns (component structure, state placement, styling choices) will be introduced step by step with context.
- You are expected to make the final call on design decisions — the explanations are there to make those calls informed, not to have them made for you.

If anything is unclear at any point, ask. Explaining is part of the process.

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
├── styles/
│   └── tokens.css     Design tokens — colours, fonts. THE only file to change when rebranding.
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

## Design Tokens & Theming

**Branding is not defined yet.** Token values below are placeholders. When branding is finalised, only `src/styles/tokens.css` needs changing — no component files.

For the full rules on how to use tokens (what's forbidden, componentisation rules, responsive conventions, accessibility requirements), see [`CONVENTIONS.md`](../CONVENTIONS.md).

### Token file — `src/styles/tokens.css`

```css
@theme {
  /* Backgrounds */
  --color-bg-base:       #030712;   /* page / room background */
  --color-bg-surface:    #111827;   /* panels, cards */
  --color-bg-elevated:   #1f2937;   /* inputs, hover surfaces */

  /* Borders */
  --color-border:        #374151;

  /* Accent */
  --color-accent:        #9333ea;   /* primary interactive */
  --color-accent-hover:  #a855f7;
  --color-accent-subtle: #581c87;   /* badge / chip backgrounds */

  /* States */
  --color-success:       #4ade80;
  --color-warning:       #facc15;
  --color-danger:        #f87171;

  /* Text */
  --color-text-primary:  #f3f4f6;
  --color-text-muted:    #9ca3af;

  /* Typography — swap here only */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

### Common component patterns

| Component | Class pattern |
|---|---|
| Page background | `bg-bg-base` |
| Panel / card | `rounded-xl border border-border bg-bg-surface p-4` |
| Primary button | `rounded-lg bg-accent px-4 py-2 text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent` |
| Badge / chip (selected) | `rounded-full bg-accent-subtle px-2 py-0.5 text-xs text-accent-hover` |
| Badge / chip (unselected) | `rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-text-muted` |
| Body text | `text-text-primary` |
| Muted text | `text-text-muted` |
| Success state | `text-success` |
| Warning state | `text-warning` |
| Danger / error state | `text-danger` |

Spacing: 4-point scale (`p-4`, `gap-4`, `m-2`). Avoid arbitrary values.

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
