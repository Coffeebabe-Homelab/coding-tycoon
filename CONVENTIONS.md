# Frontend Conventions — Coding Tycoon

> Rules for writing frontend code in this project.
> Read alongside `frontend/SPEC.md` (architecture, token definitions, component patterns).
> These conventions apply to every agent and contributor working on the frontend.

---

## Tailwind: Semantic Tokens, Not Raw Palette Values

All colours, fonts, spacing scale additions, and border radii are defined **once** in `src/styles/tokens.css` as CSS custom properties via Tailwind's `@theme`. Components consume them by their semantic name — never by a raw Tailwind palette value.

This keeps rebranding, dark mode, and design updates to a **single-file change** instead of a codebase-wide find-and-replace.

```
src/styles/tokens.css   ← THE only file to edit when rebranding
```

❌ **Bad** — raw palette, breaks on rebrand:
```tsx
<div className="bg-gray-900 border border-gray-700 text-gray-200">
```

✅ **Good** — semantic token, survives any rebrand:
```tsx
<div className="bg-bg-surface border border-border text-text-primary">
```

Token names and their current placeholder values are defined in `frontend/SPEC.md § Design Tokens & Theming`.

---

## Tailwind: Componentise Repeated Class Strings

If the same combination of 5+ utility classes appears more than twice, extract it into a reusable component. Copy-pasting class strings is the frontend equivalent of duplicating a function body.

❌ **Bad** — same string copy-pasted:
```tsx
<button className="rounded-lg bg-accent px-4 py-2 text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent">Save</button>
<button className="rounded-lg bg-accent px-4 py-2 text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent">Submit</button>
```

✅ **Good** — one component, one place to update:
```tsx
// components/Button.tsx
export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="rounded-lg bg-accent px-4 py-2 text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
      {...props}
    >
      {children}
    </button>
  )
}
```
```tsx
<Button>Save</Button>
<Button>Submit</Button>
```

Rebranding, hover states, and future tweaks (adding a shadow, changing padding) happen in one file.

---

## Tailwind: Class Ordering

Class order must follow the Prettier Tailwind plugin sort. Do not hand-order classes. CI enforces this via `npm run lint`.

Base rule of thumb when reading or writing manually:
```
layout → sizing → spacing → typography → colour → border → effects → state variants
```

State variants follow this order within a class group:
```
base → responsive (sm: md: lg:) → hover/focus/active → dark:
```

Example — readable left-to-right cascade:
```tsx
<p className="text-sm text-text-muted md:text-base hover:text-text-primary">
```

---

## Tailwind: Responsive — Mobile-First Always

Write the base (unprefixed) class for mobile, then layer up with `sm:`, `md:`, `lg:` for larger screens. Never invert this.

❌ **Bad** — desktop-first:
```tsx
<div className="lg:flex-row flex-col">
```

✅ **Good** — mobile-first:
```tsx
<div className="flex-col lg:flex-row">
```

Group breakpoint variants next to their base utility so the progression reads clearly:
```tsx
<p className="text-sm md:text-base lg:text-lg">
```

Do not nest more than 2 responsive breakpoints per element unless genuinely necessary. If a single element needs `sm: md: lg: xl:` all four, it is usually a layout problem — use a grid or split into layout variants instead.

---

## Tailwind: hover and focus Together

Every interactive element (`button`, `a`, anything with `onClick`) **must** have both `hover:` and `focus:` states. Shipping `hover:` without `focus:` breaks keyboard navigation and fails accessibility.

```tsx
// ✅ correct — keyboard and mouse both covered
<button className="bg-accent hover:bg-accent-hover focus:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent">
```

---

## Tailwind: Arbitrary Values

Avoid arbitrary values (`w-[137px]`, `top-[13px]`) except for genuine one-off cases (pixel-perfect alignment to a specific design asset). If you need the same value more than once, add it to the token scale in `tokens.css` instead.

---

## Components: Structure and Responsibility

- **Components render UI.** They receive props and return JSX. No fetch calls, no business logic.
- **Hooks handle logic.** Data fetching, loading/error state, API calls, transformations — all in custom hooks under `src/hooks/`.
- **Pages assemble.** Route-level components (`src/pages/`) call hooks, pass data to components, handle navigation.

```
Page (assembles)
  ├── calls useProfile() ← hook (fetches, manages state)
  └── renders <ProfileCard profile={...} /> ← component (displays)
```

A component that contains a `fetch` call is a smell. A hook that returns JSX is a smell.

---

## Components: Naming and File Conventions

- Component files: `PascalCase.tsx` — one component per file, named to match the file
- Hook files: `useCamelCase.ts`
- Utility files: `camelCase.ts`
- TypeScript types/interfaces: `PascalCase`, no `I` prefix

Export components as named exports, not default exports, except for page-level components (route convention).

---

## Accessibility: Non-Negotiable Baseline

- Every interactive element must be keyboard-accessible: focusable, triggered by `Enter` or `Space`
- `hover:` and `focus:` states must always be paired (see above)
- Icon-only buttons must have `aria-label`
- Overlay panels use `role="dialog"` and `aria-label`
- Images: `alt` text always; decorative images use `alt=""`
- Minimum colour contrast: 4.5:1 for body text — the token defaults meet this, don't regress it when rebranding
- Monaco Editor containers must have `aria-label`

---

## What "Branding is not defined yet" means in practice

Current token values in `tokens.css` are reasonable dark-mode placeholders. Until branding is finalised:
- Use the token classes as defined — do not improvise one-off colours
- Do not add new tokens without discussing first
- When branding is ready, the owner updates `tokens.css` values — every component updates automatically
