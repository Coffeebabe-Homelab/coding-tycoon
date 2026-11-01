# P3-04 — Monaco `CodeEditor` Component

**Phase:** 3 — Codebase Explorer  
**Status:** ✅ Complete  
**Depends on:** P2-04  

---

## Goal

Add Monaco once, behind a single shared `CodeEditor` component. Phase 3 uses it read-only for the explorer; Phase 4 reuses the same component as the editable editor.

---

## Decision (confirmed 2026-11-01): option A, bundle Monaco locally

`@monaco-editor/react` downloads Monaco's code from a CDN (jsDelivr) at runtime by default.

| Option | Pros | Cons |
|---|---|---|
| **A. Bundle locally** (`monaco-editor` package + `loader.config({ monaco })`) *(recommended)* | No third-party service at runtime; works on the Tailscale-only staging and offline; versions pinned in `package.json`; no CSP surprises | Bigger build output (several MB, but lazy-loaded so it doesn't slow the first page load); Vite needs a small worker setup |
| B. Default CDN | Zero config, tiny build | Game breaks if the CDN is blocked or down; extra external request; version drift unless pinned |

Recorded in `frontend/SPEC.md` § Monaco Editor Integration.

---

## Acceptance Criteria

- [x] `@monaco-editor/react` and `monaco-editor` installed with **exact pinned** versions; `loader.config({ monaco })` makes it load from the bundle, with no CDN requests at runtime
- [x] `components/CodeEditor.tsx` props: `value`, `language`, `readOnly`, `onChange?`, `ariaLabel`
- [x] `readOnly` sets Monaco `readOnly: true` and `domReadOnly: true`
- [x] Options per `frontend/SPEC.md`: no minimap, font size 14, word wrap, `scrollBeyondLastLine: false`
- [x] Editor theme follows the app's dark look (tokens, not raw colours, where Monaco allows)
- [x] `lib/language.ts`: maps a file extension to a Monaco language id (`.java`, `.xml`, `.properties`, `.md`, `.json`, `.sql`, fallback `plaintext`)
- [x] `CodeEditor` is lazy-loaded (`React.lazy` + `Suspense` with the existing loading style); the initial bundle size stays roughly the same
- [x] No other file imports `@monaco-editor/react` directly
- [x] Container has an `aria-label` (accessibility baseline)

---

## Implementation Notes

- The frontend has no unit-test runner yet; `language.ts` is pure and an easy first candidate if one is added. Adding the runner is out of scope here.
- Keep Monaco-specific config inside `CodeEditor.tsx` so swapping or upgrading it touches one file.

---

## File Locations

```
frontend/src/
├── components/CodeEditor.tsx
├── lib/language.ts
└── package.json          ← updated
```

---

## Definition of Done

`npm run build` and `npm run lint` pass; Monaco shows up in a separate build chunk; the read-only editor renders a sample Java file.
