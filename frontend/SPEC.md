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
| Framework | React 19 + TypeScript (strict mode) |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (Vite plugin) |
| Routing | React Router 7 |
| Code editor | Monaco Editor via `@monaco-editor/react` (Phase 3; one shared `CodeEditor` for the explorer and the Phase 4 editor) |
| Auth | `@auth0/auth0-react` |
| State (client) | `useState` + custom hooks; open panels live in the URL (nested routes). Zustand not adopted (P7-02) |
| Design source | [Figma](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb) |
| State (server) | Custom hooks over `fetchWithAuth`; React Query/SWR not adopted |
| Linting | oxlint (`npm run lint`); ESLint config kept for editor integration |
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
│   ├── fileTree.ts    buildFileTree(paths): flat paths → nested tree, folders first (Phase 3)
│   ├── language.ts    languageForPath(path): file extension → Monaco language id (Phase 3)
│   └── diff.ts        Diff computation utilities
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
/onboarding         → OnboardingPage (protected)
/room               → GameRoomPage (protected) — main hub: room scene + HUD + panel outlet
  /room/task        → TaskBoardPage overlay
  /room/profile     → ProfilePage overlay
  /room/end-of-day  → EndOfDayPage overlay (Phase 7)
  /room/codebase    → CodebaseExplorerPage overlay (wide)
  /room/editor      → EditorPage overlay (Phase 4)
  /room/review      → ReviewPage overlay (Phase 5)
/profile            → redirect to /room/profile
```

`/room` is wrapped in `<ProtectedRoute />`; its panels are nested routes, so they inherit the protection. Panels render through `useOutlet()` inside `GameRoomPage` and wrap their content in `<Overlay>`. While a panel is open the room is `inert`. Closing (Esc, ×, backdrop click, "Back to room") navigates to `/room`, and the browser back button closes a panel too.

### Session flow (`hooks/useSessionFlow.ts`)

On entering the room: no profile (`404`) → `/onboarding`. If the player landed on `/room` itself and today's task is `ASSIGNED`, the Task Board opens once per browser session (flag in `sessionStorage`). Deep links to a panel are never redirected. Editor and Review are not linked until they exist.

## Game Shell Components (Phase 7)

| File | Role |
|---|---|
| `game/RoomScene.tsx` | Static isometric SVG room (walls, floor, desk, monitor, chair, kanban board, door). No routing inside; takes callbacks. |
| `game/Hotspot.tsx` | SVG `role="button"` wrapper: `tabIndex`, `aria-label`, Enter/Space, `<title>` tooltip, hover/focus glow. No `onActivate` → disabled (`aria-disabled`). |
| `game/Avatar.tsx` | Placeholder player figure seated at the desk. |
| `game/RoomHud.tsx` | Top strip: total XP, current streak, "wrap up the day" link after an approval, email, Profile, Log out. |
| `components/Overlay.tsx` | Accessible modal: `role="dialog"`, `aria-modal`, labelled heading, focus trap (`lib/focusTrap.ts`), Esc/× close, restores focus to the opener. |
| `pages/EndOfDayPage.tsx` | Outcome (approved / in progress / not started), XP today, total XP, current and longest streak; actions Back to room, Log out. Skill delta hidden until Phase 6. |
| `hooks/useProgress.ts` | `GET /api/progress`; optional `refreshKey` refetches (the room refetches when a panel opens or closes). |

Hotspots: kanban board → `/room/task`, door → `/room/end-of-day`, monitor → `/room/codebase`. `Overlay` takes `wide` for panels with their own full-height layout (the explorer).

---

## State Management Rules

| Data type | Where it lives | Why |
|---|---|---|
| Task, review, profile data | React hook + `useState` (or React Query) | Server-owned, stale-able |
| Which panel is open over the room | URL (nested routes under `/room`) | Back button closes it; refresh and deep links keep it |
| Form values, toggles, local UI | `useState` | No cross-component sharing needed |

Don't add a global store unless state truly can't live in the URL or a hook. Never duplicate server data client-side.

---

## API Integration Pattern

Always use the `fetchWithAuth` helper. Never write raw `fetch` with `Authorization` headers in components. Non-2xx responses throw `ApiError` (with `status`), so hooks can branch on specific codes such as `404`.

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

  /* Room scene (Phase 7): --color-room-floor, -floor-line, -wall-left, -wall-right, -trim,
     -desk-top, -desk-side, -monitor, -screen, -board, -note, -door, -chair,
     -avatar-skin, -avatar-hair, -avatar-shirt; plus --drop-shadow-hotspot (hover/focus glow) */

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

Pinned exactly: `@monaco-editor/react` 4.7.0, `monaco-editor` 0.57.0.

```tsx
import { LazyCodeEditor } from '../components/LazyCodeEditor'
import { languageForPath } from '../lib/language'

<LazyCodeEditor
  value={code}
  language={languageForPath(path)}
  readOnly={false}                 // true for the codebase explorer
  onChange={setCode}
  ariaLabel={`Editing ${path}`}
/>
```

Monaco is wrapped once in `components/CodeEditor.tsx` (props: `value`, `language`, `readOnly`, `onChange?`, `ariaLabel`). Never import `@monaco-editor/react` anywhere else. That file holds all Monaco wiring:

- `loader.config({ monaco })` so the editor comes from the bundle, not jsDelivr
- `self.MonacoEnvironment.getWorker` with Vite `?worker` imports (editor worker, JSON worker)
- the `coding-tycoon-dark` theme, built on `vs-dark` from the `tokens.css` colour variables
- options: no minimap, font size 14, word wrap, `scrollBeyondLastLine: false`

Pages render `LazyCodeEditor` (`React.lazy` + `Suspense` with a "Loading editor…" message), which keeps Monaco in its own build chunks.

For the **Codebase Explorer** (Phase 3, read-only): `readOnly` sets `readOnly: true` and `domReadOnly: true`.
For the **Editor panel** (Phase 4): allow edits, bind value to component state, surface changes via `onChange`.
Monaco is **bundled locally**, never loaded from a CDN, so it works on the Tailscale-only staging and offline (P3-04).

### Codebase Explorer (Phase 3)

`pages/CodebaseExplorerPage.tsx` at `/room/codebase`, rendered as a wide `Overlay` over the room: `FileTree` on the left, read-only `LazyCodeEditor` on the right.

- `hooks/useCodebase.ts` loads `GET /api/codebase/files` once and exposes `{ files, focusFiles, openFile, current, isLoading, error, noActiveTask }`. `openFile(path)` fetches `GET /api/codebase/files/{path}` and ignores stale responses.
- The open file lives in the URL (`?file=<path>`), so refresh, deep links and Back keep it. Without `?file`, the first focus file opens (else the first file).
- `components/FileTree.tsx`: collapsible folders built from native buttons (Tab/Enter/Space), text glyphs per file type, focus files in `text-warning`, folders leading to focus files start expanded.
- 404 on the file list shows "no task yet" with a link to the Task Board. The Task Board lists the task's `focusFiles` as explorer deep links plus an "Explore codebase" link.
- `components/TextLink.tsx`: the shared inline accent link (paired hover/focus).

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
