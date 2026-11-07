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
  --color-border: #2e2852;   --color-border-strong: #433b70;

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

Font family names assume D1 = self-hosted variable fonts. Spacing needs no tokens: Figma's scale is Tailwind's default.

## Steps

### 1. Add new tokens (no visual change)
- [ ] Add `border-strong`, `accent-on-subtle`, `accent-ink`, `info`, all `*-subtle`, `rgb-*` and shadows. Switch to `@theme static`.

### 2. Apply colour values and fix contrast (one commit)
- [ ] Update the 12 existing values to Figma.
- [ ] `text-text-primary` → `text-accent-ink` on the 7 solid accent controls: `LoginPage`, `OnboardingWizard` ×2, `ProfilePage` ×2, `EndOfDayPage`, `TaskBoardPage`.
- [ ] `text-accent-hover` → `text-accent-on-subtle` on `accent-subtle` in `TopicChip`, `TaskBoardPage` tags and `ProfilePage` tags.
- [ ] `difficultyClasses()`: use `bg-success-subtle`, `bg-warning-subtle`, `bg-danger-subtle`.
- [ ] `--color-room-avatar-shirt` → `var(--color-accent)`. It's the only leftover purple. Other `room-*` tokens stay as placeholder art.
- [ ] Update the "when branding is finalised" comment in `tokens.css`.

### 3. Apply radius values (one commit)
- [ ] Add the radius scale.
- [ ] `rounded-lg` → `rounded-md` on all 12 current uses (all are buttons).
- [ ] `rounded` → `rounded-md` in `FileTree`.
- [ ] `rounded-xl` → `rounded-lg` in `SelectionCard` and the `EndOfDayPage` stat tile (cards). Keep `rounded-xl` on `Overlay`, `LoginPage` and `OnboardingWizard` (panels).

### 4. Focus rule (assumes D2 = global rule)
- [ ] Add to `index.css`, in `@layer base`: `:focus-visible { outline: 2px solid var(--color-info); outline-offset: 2px; }`.
- [ ] Remove `focus:ring-*`, `focus:outline-none`, `focus:bg-accent-hover`, `focus:border-accent` and the link `focus:underline`/`focus:text-*` classes from the 12 files that use them. Figma keeps the normal background on focus.
- [ ] Keep `focus:outline-none` on the `Overlay` panel, which receives focus by script and isn't a control.
- [ ] `Hotspot`: replace `focus:` with `focus-visible:`. Check that the outline shows on an SVG `<g>`. If it doesn't, use an `info` drop shadow.

### 5. Fonts (assumes D1 = self-hosted)
- [ ] Add pinned `@fontsource-variable/pixelify-sans`, `space-grotesk` and `jetbrains-mono`; import them in `main.tsx`.
- [ ] Add `--font-display`, `--font-sans` and `--font-mono`; delete the ignored `--font-family-*` lines.
- [ ] Apply `font-display` to the logo in `RoomHud` (Pixelify Medium 20, uppercase, `text-accent`), the `LoginPage` title, and XP and streak values in `RoomHud` and `EndOfDayPage`.

### 6. Text style tokens (assumes D3 = named tokens)
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

### 8. Docs
- [ ] `frontend/SPEC.md`: remove "Branding is not defined yet" (line 146); replace the token snippet and pattern table; font and radius sections; replace the contrast claim at line 319 with the Figma pairs; Monaco options.
- [ ] `CONVENTIONS.md`: `text-accent-ink` in examples (lines 39, 40, 49); rewrite "hover and focus Together" (lines 103–110) around `:focus-visible`; fix line 154; replace "What Branding is not defined yet means" (lines 159–164) with "Figma variables first, then `tokens.css`, same PR".
- [ ] `CHANGELOG.md`.

## Files affected
`frontend/src/styles/tokens.css`, `frontend/src/index.css`, `frontend/src/main.tsx`, `frontend/package.json`, `frontend/package-lock.json`, `frontend/src/components/{CodeEditor,FileTree,OnboardingWizard,Overlay,SelectionCard,TextLink,TopicChip}.tsx`, `frontend/src/game/{Hotspot,RoomHud}.tsx`, `frontend/src/pages/{EndOfDayPage,LoginPage,ProfilePage,TaskBoardPage}.tsx`, `frontend/SPEC.md`, `CONVENTIONS.md`, `CHANGELOG.md`.

## Verification
| Step | How |
|------|-----|
| Baseline, and after every commit | `npm run lint` and `npm run build` pass |
| 1, 2 | `grep -n "#" src/styles/tokens.css` matches the target; search finds no `text-text-primary` next to `bg-accent` and no purple value |
| 2 | Compare a primary button in dev tools: contrast 8.0:1 |
| 3 | No `rounded-lg` left on a button; measure 8px in dev tools |
| 4 | Tab through Login, room, every panel: 2px cyan ring with a gap. Click with a mouse: no ring. Text inputs do show a ring on click, which is normal browser behaviour |
| 5 | Dev tools show the three fonts as rendered; Network tab has no third-party requests; works with the network off |
| 6 | Check one element per style against Figma, including an `overline` |
| 7 | After a hard reload, open a Java file in the explorer and select text: the selection lines up with the characters, and keywords, types, annotations, strings and comments use the 45:255 colours |
| All | Compare every current screen with Figma at 1280 and 1440 wide. Colours, fonts and radius should match; layout differences are later stages |

Unit tests: none here. SPEC says to test behaviour, not styling, and this stage doesn't change behaviour.

## Risks
- Hover colours change in the same stage as focus, so mouse and keyboard states need checking separately.
- Parallel branches using the old classes will conflict. Rebase and repeat the search checks.

## Done when
1. `tokens.css` matches the target and the 12 placeholder values are gone.
2. Every solid accent control uses `text-accent-ink`.
3. All three fonts load from our own build (per D1).
4. Keyboard focus shows the `info` ring everywhere, mouse clicks on buttons don't.
5. SPEC and CONVENTIONS no longer mention placeholder branding.
6. Cards [tokens](https://trello.com/c/WgHECfmr), [fonts](https://trello.com/c/JBsXyvW1) and [docs](https://trello.com/c/uFtgKnQ2) are moved per the AGENTS.md workflow.
