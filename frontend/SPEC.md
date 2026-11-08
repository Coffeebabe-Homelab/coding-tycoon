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
| Design source | [Figma](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb); the spec is copied to [DESIGN_SPEC.md](../docs/design/DESIGN_SPEC.md) |
| State (server) | Custom hooks over `fetchWithAuth`; React Query/SWR not adopted |
| Linting | oxlint (`npm run lint`), the only linter |
| Formatting | Prettier (`npm run format:check`, run in CI) |

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

Always use the `fetchWithAuth` helper. Never write raw `fetch` with `Authorization` headers in components. Non-2xx responses throw `ApiError` (with `status`), so hooks can branch on specific codes such as `404`. A missing token throws a `401` `ApiError` without calling the API.

```ts
// lib/api.ts
export const fetchWithAuth = async <T>(
  path: string,
  token: string | undefined,
  options?: RequestInit,
): Promise<T> => {
  if (!token) throw new ApiError(401, 'No access token')

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

The visual identity is Night Shift, defined in Figma ([`docs/design/DESIGN_SPEC.md`](../docs/design/DESIGN_SPEC.md) is a readable copy). Figma variables change first, then `src/styles/tokens.css` in the same PR. Components only use token names, so a value change needs no component edits.

For the full rules on how to use tokens (what's forbidden, componentisation rules, responsive conventions, accessibility requirements), see [`CONVENTIONS.md`](../CONVENTIONS.md).

### Token file — `src/styles/tokens.css`

```css
@theme static {
  /* Backgrounds */
  --color-bg-base:          #0b0918;  /* page / room background */
  --color-bg-surface:       #141127;  /* panels, cards */
  --color-bg-elevated:      #1e1a38;  /* inputs, hover surfaces */

  /* Borders */
  --color-border:           #2e2852;
  --color-border-strong:    #433b70;
  --color-border-input:     #6c6494;  /* default input strokes */

  /* Accent */
  --color-accent:           #ff8a3d;  /* primary interactive */
  --color-accent-hover:     #ffa366;
  --color-accent-subtle:    #3d2214;  /* badge / chip backgrounds */
  --color-accent-on-subtle: #ffb98a;  /* text on accent-subtle */
  --color-accent-ink:       #1b0f06;  /* text on solid accent */

  /* States, each with a *-subtle background */
  --color-info:             #4cc9f0;  /* focus ring */
  --color-success:          #4be3a0;
  --color-warning:          #ffd166;
  --color-danger:           #ff6b81;

  /* Text */
  --color-text-primary:     #f3f0ff;
  --color-text-muted:       #a9a2c9;

  /* Also: --color-rgb-magenta, --color-rgb-violet (room lighting); --shadow-card, -overlay,
     -glow-accent; the Phase 7 room scene --color-room-* set and --drop-shadow-hotspot */
}
```

`static` makes Tailwind emit every variable, because `CodeEditor` reads them at runtime.

### Radius

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 4px | Difficulty tags |
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 12px | Cards |
| `rounded-xl` | 16px | Panels and windows |
| `rounded-full` | 999px | Pills |

### Typography

Three variable fonts, self-hosted through pinned `@fontsource-variable` packages and imported in `main.tsx`, so the app makes no third-party font requests.

| Class | Font | Use |
|---|---|---|
| `font-display` | Pixelify Sans | Logo, game numbers |
| `font-sans` | Space Grotesk | Default for all interface text |
| `font-mono` | JetBrains Mono | Code |

Named text classes set size, line height, weight and tracking together: `text-display-xl`, `-display-l`, `-display-m`, `text-h1`, `-h2`, `-h3`, `text-body-l`, `-body-m`, `text-label-m`, `-label-s`, `text-overline`, `text-code-m`, `-code-s`. Use them for new work. Existing components move over when they are next rebuilt.

### Focus

One rule in `src/index.css` draws a 2px `info` ring with a 2px gap on `:focus-visible`. Don't add `focus:` classes to controls.

### UI primitives

One Figma component set is one React component, and its variants are props. Prop names follow the Design Spec › 11 handoff table. Primitives are presentational. Add other Figma components when something first uses them.

| Component | Figma | Usage |
|---|---|---|
| `Button` | 8:31 | `<Button variant="primary\|secondary\|danger" disabled />`. Primary is the default, and `type` defaults to `"button"` |
| `buttonClasses(variant)` | 8:31 | For a router `Link` styled as a button, which must stay an anchor |
| `Icon` | 7:217 | `<Icon name="x" />`. 16px, inherits the text colour, hidden from screen readers by default. `flame` and the `branch` node keep their Figma colours |
| `Difficulty` | 8:106 | `<Difficulty level={task.difficulty} />`. Matches any case, and unknown values are neutral |
| `StatusBadge` | 8:96 | `<StatusBadge status={task.status} />`. Always a dot and a word |

### Common component patterns

| Component | Class pattern |
|---|---|
| Page background | `bg-bg-base` |
| Panel | `rounded-xl border border-border bg-bg-surface p-4` |
| Card | `rounded-lg border border-border bg-bg-elevated p-4` |
| Button | `<Button>` (see UI primitives) |
| Badge / chip (selected) | `rounded-full bg-accent-subtle px-2 py-0.5 text-xs text-accent-on-subtle` |
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
- `editor.background` is `bg-base`, and syntax colours come from tokens (keyword `accent-hover`, type `info`, annotation `warning`, string `success`, comment `text-muted`)
- options: no minimap, JetBrains Mono at 13/20, word wrap, `scrollBeyondLastLine: false`
- `monaco.editor.remeasureFonts()` once JetBrains Mono has loaded, because Monaco caches glyph widths

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
- `components/TextLink.tsx`: the shared inline accent link.

---

## Auth0 Integration

```tsx
// components/AuthProvider.tsx, rendered inside BrowserRouter
<Auth0Provider
  domain={import.meta.env.VITE_AUTH0_DOMAIN}
  clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
  authorizationParams={{
    redirect_uri: `${window.location.origin}/callback`,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  }}
  onRedirectCallback={(appState) => navigate(appState?.returnTo ?? '/room', { replace: true })}
>
```

Deep links survive login. `ProtectedRoute` starts the redirect from an effect, never during render, and passes the current path and query as `appState.returnTo`. `AuthProvider` navigates back to it after login. `CallbackPage` shows Try again and Log out if Auth0 returns an error.

Tokens stay in memory, so a hard refresh makes the SDK re-authenticate. If the browser blocks third-party cookies, that is a full redirect through Auth0, which then returns to the same page.

Use `getAccessTokenSilently()` to retrieve the access token — always in hooks or `useEffect`, never at render time.

---

## Testing

### Tools

- **Vitest** — unit tests for hooks and utilities
- **React Testing Library** — component tests
- **jsdom** — DOM environment for Vitest

### Running

| Command | Use |
|---|---|
| `npm test` | Run everything once |
| `npm run test:watch` | Re-run on save while developing |
| `npm run test:coverage` | Run with coverage and enforce the threshold (what CI and Jenkins run) |

Config lives in `vite.config.ts` (`test` block), setup and helpers in `src/test/`. Tests sit next to the code as `*.test.ts(x)`: `tsc -b` type-checks them, and nothing imports them from `main.tsx`, so they stay out of the bundle.

Versions are pinned to what still runs on Node 20 (CI). Vitest 5, jsdom 30+ and jest-dom 6.10+ need Node 22; upgrade them when CI moves.

### Coverage

At least 70% statements, branches, functions and lines across `lib`, `hooks`, `components`, `pages`, `game` and `App.tsx`, measured as one total. Not measured: `main.tsx`, `types/`, test files.

### Mocking

Mock at the boundary only: `@auth0/auth0-react` (`authState()`), `fetch` (`stubApi()`) and Monaco. Keep real hooks and a real `MemoryRouter`, and assert the URL with `LocationProbe` rather than mocking `navigate`.

### Known bugs

Record a bug owned by another card with `it.fails` and a comment linking the card. The test states the correct behaviour, so fixing the bug makes Vitest flag it, and you then drop `.fails`.

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
- Colour contrast: minimum 4.5:1 for text, 3:1 for UI parts. Text on solid `accent` uses `accent-ink` (8.0:1), never `text-primary` (2.09:1). The checked Figma pairs are in [`PLAN-design-foundation.md`](../docs/design/PLAN-design-foundation.md)
- Images need `alt` text; decorative images use `alt=""`
- Monaco Editor: the editor container must have an `aria-label`
