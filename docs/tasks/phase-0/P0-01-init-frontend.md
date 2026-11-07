# P0-01 — Initialise Frontend

**Phase:** 0 — Foundation  
**Status:** ✅ Complete  
**Depends on:** —  

---

## Goal

Scaffold the `frontend/` directory with Vite + React + TypeScript + Tailwind CSS. The result is a running dev server with a blank page — no features, no errors.

---

## Acceptance Criteria

- [x] `frontend/` directory exists at repo root
- [x] `npm run dev` starts the Vite dev server on `http://localhost:5173`
- [x] Page loads in the browser with no console errors
- [x] TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)
- [x] Tailwind CSS installed and working — a test class (e.g. `bg-blue-500`) applies correctly
- [x] ESLint configured with React + TypeScript rules
- [x] Prettier configured and integrated with ESLint
- [x] `npm run build` produces a clean production build
- [x] `npm run lint` passes with zero errors on the scaffolded code

---

## Implementation Notes

```bash
# Scaffold with Vite
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Install Tailwind CSS
npm install -D tailwindcss @tailwindcss/vite
```

Configure Tailwind in `vite.config.ts` (Vite plugin approach — no `postcss.config` needed):
```ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Add to `src/index.css`:
```css
@import "tailwindcss";
```

**ESLint + Prettier:**
```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

---

## File Structure (expected output)

```
frontend/
├── public/
├── src/
│   ├── App.tsx          ← blank placeholder
│   ├── main.tsx
│   └── index.css        ← Tailwind import
├── index.html
├── package.json
├── tsconfig.json        ← strict: true
├── tsconfig.app.json
├── vite.config.ts
├── eslint.config.js
└── .prettierrc
```

---

## Definition of Done

- Dev server runs, Tailwind applies, lint passes, build succeeds.
