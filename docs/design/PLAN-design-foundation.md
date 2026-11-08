# PLAN — Design Stage 1: Foundation

Roadmap: [PLAN-design-implementation.md](PLAN-design-implementation.md)

## Goal
Apply the Night Shift tokens, the contrast fix, the focus rule and the fonts, and update the docs. After this PR the app looks like Night Shift with its current layouts.

**Cards:** [tokens](https://trello.com/c/WgHECfmr), [fonts](https://trello.com/c/JBsXyvW1), [docs](https://trello.com/c/uFtgKnQ2)
**Needs:** decisions D1, D2, D3.

## Constraints
- Never change the accent value without the text fix in the same commit.
- `tokens.css` mirrors Figma's semantic tokens only, not the Primitives collection.
- Each commit stays under 100 lines, not counting `package-lock.json`.

## Target tokens
Source: Figma variables on 7:2, naming rule from 48:295.

```css
@theme static {
  --color-bg-base: #0b0918;  --color-bg-surface: #141127;  --color-bg-elevated: #1e1a38;
  --color-border: #2e2852;   --color-border-strong: #433b70;   --color-border-input: #6c6494;

  --color-accent: #ff8a3d;   --color-accent-hover: #ffa366;
  --color-accent-subtle: #3d2214;  --color-accent-on-subtle: #ffb98a;  --color-accent-ink: #1b0f06;

  --color-info: #4cc9f0;     --color-info-subtle: #0e2a36;
  --color-success: #4be3a0;  --color-success-subtle: #0f2e24;
  --color-warning: #ffd166;  --color-warning-subtle: #33280f;
  --color-danger: #ff6b81;   --color-danger-subtle: #3a1520;

  --color-text-primary: #f3f0ff;  --color-text-muted: #a9a2c9;
  --color-rgb-magenta: #e84df5;   --color-rgb-violet: #7b5cff;

  --radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 12px;  --radius-xl: 16px;  --radius-full: 999px;

  --shadow-card: 0 4px 12px rgb(0 0 0 / 0.35);
  --shadow-overlay: 0 16px 48px rgb(0 0 0 / 0.55);
  --shadow-glow-accent: 0 0 24px rgb(255 138 61 / 0.45);

  --font-display: 'Pixelify Sans Variable', ui-sans-serif, system-ui, sans-serif;
  --font-sans: 'Space Grotesk Variable', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;
}
```

`static` matters because Tailwind v4 otherwise only outputs variables a class uses, and `CodeEditor` reads them at runtime with `getComputedStyle`.

Font family names follow D1: self-hosted variable fonts. Spacing needs no tokens: Figma's scale is Tailwind's default.

## Contrast
Calculated with the WCAG 2.1 formula from the Figma values. The Design Spec table ([`DESIGN_SPEC.md`](DESIGN_SPEC.md) § 03) agrees for the pairs it lists. Text needs 4.5:1. UI parts need 3:1. Disabled controls are exempt.

| Foreground on background | Ratio | Result |
|--------------------------|-------|--------|
| `text-primary` on `accent` (every solid accent control today) | **2.09** | **Fails.** It was 4.89 on the old purple, so changing only the accent makes things worse |
| `text-primary` on `accent-hover` | **1.75** | **Fails** |
| `accent-ink` on `accent` / `accent-hover` | 8.01 / 9.56 | Passes: the fix |
| `accent-ink` on `danger` (Danger button hover) | 6.87 | Passes |
| `text-primary` on `bg-surface` / `bg-base` / `bg-elevated` | 16.43 / 17.55 / 14.86 | Passes |
| `text-muted` on `bg-surface` / `bg-elevated` | 7.64 / 6.90 | Passes |
| `accent` on `bg-surface` / `bg-elevated` (`TextLink`, HUD links) | 7.86 / 7.11 | Passes. Improves on the old 3.30 |
| `accent-on-subtle` on `accent-subtle` | 8.74 | Passes |
| `accent-hover` on `accent-subtle` (today's chips and tags) | 7.43 | Passes, but off-design |
| success / warning / danger / info on own `*-subtle` | 8.91 / 10.04 / 5.87 / 7.78 | Passes |
| `danger` at 20% tint on `bg-surface` with `danger` text (today's Hard badge) | 4.99 | Passes, replaced by `danger-subtle` |
| `info` ring on `bg-surface` | 9.59 | Passes 3.0 |
| `info` ring on `accent` | 1.22 | Fails if it touches the button, which is why the 2px offset matters |
| `border-input` on `bg-surface` / `bg-elevated` | 3.41 / 3.09 | Passes 3:1 for input boundaries (D4) |
| `border` / `border-strong` on `bg-surface` | 1.35 / 1.84 | Under 3:1, so not used for input boundaries, except a disabled input's `border`, which is exempt |

## Searches
These replace hand-made lists, which go stale. Run them from the repo root when the work starts and again before the PR. Counts are from `dev` 25b7bb0.

| Name | Command | Count |
|------|---------|-------|
| Solid accent controls | `grep -rnE 'bg-accent[ "]' frontend/src --include='*.tsx' --exclude='*.test.tsx'` | 8 |
| `rounded-lg` uses | `grep -rn 'rounded-lg' frontend/src --include='*.tsx' --exclude='*.test.tsx'` | 14 |
| Focus classes | `grep -rn 'focus:' frontend/src --include='*.tsx' --exclude='*.test.tsx'` | 22 lines in 13 files |

## Steps

### 1. Add new tokens (no visual change)
- [ ] Add `border-strong`, `border-input`, `accent-on-subtle`, `accent-ink`, `info`, all `*-subtle`, `rgb-*` and shadows. Switch to `@theme static`.

### 2. Apply colour values and fix contrast (one commit)
- [ ] Update the 12 existing values to Figma.
- [ ] `text-text-primary` → `text-accent-ink` on every match of the solid accent search. On 25b7bb0: `LoginPage`, `CallbackPage`, `OnboardingWizard` ×2, `ProfilePage` ×2, `EndOfDayPage`, `TaskBoardPage`.
- [ ] `text-accent-hover` → `text-accent-on-subtle` on `accent-subtle` in `TopicChip`, `TaskBoardPage` tags and `ProfilePage` tags.
- [ ] `difficultyClasses()`: use `bg-success-subtle`, `bg-warning-subtle`, `bg-danger-subtle`.
- [ ] `--color-room-avatar-shirt` → `var(--color-accent)`. It's the only leftover purple. Other `room-*` tokens stay as placeholder art.
- [ ] Update the "when branding is finalised" comment in `tokens.css`.

### 3. Apply radius values (one commit)
- [ ] Add the radius scale.
- [ ] `rounded-lg` → `rounded-md` on every match of the `rounded-lg` search. Confirm each match is a button.
- [ ] `rounded` → `rounded-md` in `FileTree`.
- [ ] `rounded-xl` → `rounded-lg` in `SelectionCard` and the `EndOfDayPage` stat tile (cards). Keep `rounded-xl` on `Overlay`, `LoginPage` and `OnboardingWizard` (panels).
- [ ] `shadow-2xl` → `shadow-overlay` on `Overlay`.

### 4. Focus rule (D2: global rule)
- [ ] Add to `index.css`, in `@layer base`: `:focus-visible { outline: 2px solid var(--color-info); outline-offset: 2px; }`.
- [ ] Remove `focus:ring-*`, `focus:outline-none`, `focus:bg-accent-hover`, `focus:border-accent` and the link `focus:underline`/`focus:text-*` classes from every match of the focus search. Figma keeps the normal background on focus.
- [ ] Keep `focus:outline-none` on the `Overlay` panel, which receives focus by script and isn't a control.
- [ ] `Hotspot`: replace `focus:` with `focus-visible:`. Check that the outline shows on an SVG `<g>`. If it doesn't, use an `info` drop shadow.

### 5. Fonts (D1: self-hosted)
- [ ] Add pinned `@fontsource-variable/pixelify-sans`, `space-grotesk` and `jetbrains-mono`; import them in `main.tsx`.
- [ ] Add `--font-display`, `--font-sans` and `--font-mono`; delete the ignored `--font-family-*` lines.
- [ ] Apply `font-display` to the logo in `RoomHud` (Pixelify Medium 20, uppercase, `text-accent`), the `LoginPage` title, and XP and streak values in `RoomHud` and `EndOfDayPage`.

### 6. Text style tokens (D3: named tokens)
- [ ] Add the 13 styles as `--text-*` with `--line-height`, `--font-weight` and `--letter-spacing` sub-values, from 7:101:

| Token | Family class | Size/line | Weight | Spacing |
|-------|--------------|-----------|--------|---------|
| `display-xl` | `font-display` | 48/56 | 700 | 0 |
| `display-l` | `font-display` | 32/40 | 600 | 0 |
| `display-m` | `font-display` | 20/28 | 500 | 0 |
| `h1` | sans | 28/36 | 700 | -0.5px |
| `h2` | sans | 20/28 | 700 | -0.25px |
| `h3` | sans | 16/24 | 500 | 0 |
| `body-l` | sans | 16/24 | 400 | 0 |
| `body-m` | sans | 14/20 | 400 | 0 |
| `label-m` | sans | 14/20 | 500 | 0 |
| `label-s` | sans | 12/16 | 500 | 0 |
| `overline` | sans | 12/16 | 700 | 1.2px |
| `code-m` | `font-mono` | 13/20 | 400 | 0 |
| `code-s` | `font-mono` | 12/16 | 400 | 0 |

- [ ] Confirm `--text-*--font-weight` works in the installed Tailwind 4.3.3.
- [ ] No sweep of existing components: they move when next touched.

### 7. Monaco theme (`CodeEditor.tsx`)
- [ ] `fontFamily` from `--font-mono`, `fontSize: 13`, `lineHeight: 20`.
- [ ] Remeasure after the font loads, so the cursor stays aligned: `document.fonts.load(...)`, then `monaco.editor.remeasureFonts()`.
- [ ] `editor.background` → `--color-bg-base`; `editorCursor.foreground` → `--color-accent`.
- [ ] Syntax rules from 45:255: keyword `accent-hover`, type `info`, annotation `warning`, string `success`, comment `text-muted`. Monaco rule colours are written without the `#`.
- [ ] Extend the Monaco mock in `CodeEditor.test.tsx` with `remeasureFonts`, and stub `document.fonts` if jsdom doesn't provide it, so the existing tests keep passing.

### 8. Docs
Find these by their text: line numbers move.
- [ ] `frontend/SPEC.md`: remove "Branding is not defined yet"; replace the token snippet and pattern table; font and radius sections; replace the "gray-200 on gray-900" contrast claim with the Figma pairs; Monaco options.
- [ ] `CONVENTIONS.md`: `text-accent-ink` in the `bg-accent` examples; rewrite "Tailwind: hover and focus Together" around `:focus-visible`; rewrite the Accessibility baseline line "`hover:` and `focus:` states must always be paired"; replace "What Branding is not defined yet means in practice" with "Figma variables first, then `tokens.css`, same PR".
- [ ] `CHANGELOG.md`.

## Files affected
`frontend/src/styles/tokens.css`, `frontend/src/index.css`, `frontend/src/main.tsx`, `frontend/package.json`, `frontend/package-lock.json`, `frontend/src/components/{CodeEditor,CodeEditor.test,FileTree,OnboardingWizard,Overlay,SelectionCard,TextLink,TopicChip}.tsx`, `frontend/src/game/{Hotspot,RoomHud}.tsx`, `frontend/src/pages/{CallbackPage,EndOfDayPage,LoginPage,ProfilePage,TaskBoardPage}.tsx`, `frontend/SPEC.md`, `CONVENTIONS.md`, `CHANGELOG.md`.

## Verification
| Step | How |
|------|-----|
| Baseline, and after every commit | `npm run lint` and `npm run build` pass |
| Baseline, and before the PR | `npm test` and `npm run test:coverage` pass |
| 1, 2 | `grep -n "#" src/styles/tokens.css` matches the target; the solid accent search finds no `text-text-primary` and no purple value remains |
| 2 | Compare a primary button in dev tools: contrast 8.0:1 |
| 3 | No `rounded-lg` left on a button; measure 8px in dev tools |
| 4 | Tab through Login, room, every panel: 2px cyan ring with a gap. Click with a mouse: no ring. Text inputs do show a ring on click, which is normal browser behaviour |
| 5 | Dev tools show the three fonts as rendered; Network tab has no third-party requests; works with the network off |
| 6 | Check one element per style against Figma, including an `overline` |
| 7 | After a hard reload, open a Java file in the explorer and select text: the selection lines up with the characters, and keywords, types, annotations, strings and comments use the 45:255 colours |
| All | Compare every current screen with Figma at 1280 and 1440 wide. Colours, fonts and radius should match; layout differences are later stages |

New unit tests: none, apart from the Monaco mock change in step 7. `frontend/SPEC.md` says to test behaviour, not styling, and this stage doesn't change behaviour.

## Risks
- Hover colours change in the same stage as focus, so mouse and keyboard states need checking separately.
- Parallel branches using the old classes will conflict. Rebase and repeat the search checks.

## Done when
1. `tokens.css` matches the target and the 12 placeholder values are gone.
2. Every match of the solid accent search uses `text-accent-ink`.
3. All three fonts load from our own build (per D1).
4. Keyboard focus shows the `info` ring everywhere, mouse clicks on buttons don't.
5. `frontend/SPEC.md` and `CONVENTIONS.md` no longer mention placeholder branding.
6. Cards [tokens](https://trello.com/c/WgHECfmr), [fonts](https://trello.com/c/JBsXyvW1) and [docs](https://trello.com/c/uFtgKnQ2) are moved per the AGENTS.md workflow.
