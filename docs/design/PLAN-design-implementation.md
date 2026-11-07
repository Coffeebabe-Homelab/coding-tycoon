# PLAN — Night Shift design implementation (roadmap)

## Goal
Make the frontend match the Figma design system (Night Shift) in a safe order, so Phase 4 builds on the final tokens, fonts and primitives instead of adding more UI to redo later.

> This file is the roadmap. Each stage has its own plan, ships as its own PR and can be reviewed alone. Reviewed against `dev` 48ade13 and [Figma](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb) on 2026-11-06. Nothing here is implemented yet.

## Stages

| # | Stage | Plan | Trello | Depends on | Needed before Phase 4? |
|---|-------|------|--------|------------|------------------------|
| 1 | Foundation: tokens, contrast, focus, fonts, Monaco theme, docs | [foundation](PLAN-design-foundation.md) | [tokens](https://trello.com/c/WgHECfmr), [fonts](https://trello.com/c/JBsXyvW1), [docs](https://trello.com/c/uFtgKnQ2) | Decisions D1–D3 | Yes |
| 2 | Primitives: Button, Icon, Difficulty, StatusBadge, Chip, Input | [primitives](PLAN-design-primitives.md) | [primitives](https://trello.com/c/Bu7ggkjA) | Stage 1, D4, D9, D10 | Yes |
| 3 | Shell: App Bar, tabbed panel window, standalone Profile | [shell](PLAN-design-shell.md) | [routes](https://trello.com/c/LXw2xTF7) (no card covers the whole shell) | Stage 2, D5–D7 | Recommended (D5) |
| 4 | Login and onboarding | [screens](PLAN-design-screens.md) | [routes](https://trello.com/c/LXw2xTF7) | Stage 2, D8 | No |

```
Stage 1 ──▶ Stage 2 ──▶ Stage 3 ──▶ Phase 4
                 └────▶ Stage 4 (any time after Stage 2)
```

Stage 1 can start as soon as D1–D3 are answered. The Vitest setup that Stage 2 relies on is merged on `dev` (PR #26).

## Current state vs Figma

| Area | Figma | Code on `dev` | Stage |
|------|-------|---------------|-------|
| Colours | 22 semantic variables (Tokens 7:2) | 12 placeholder values, purple accent | 1 |
| Fonts | Pixelify Sans, Space Grotesk, JetBrains Mono | None loaded. `--font-family-*` names are ignored by Tailwind v4 | 1 |
| Text styles | 13 named styles (7:101) | Tailwind sizes set per component | 1 |
| Radius | sm 4, md 8, lg 12, xl 16, full 999 | Tailwind defaults: sm 4, md 6, lg 8, xl 12 | 1 |
| Shadows | Card, Overlay, Glow/Accent | `shadow-2xl` once, `--drop-shadow-hotspot` | 1 |
| Focus | 2px `info` ring, 2px offset, keyboard only (48:260) | `focus:ring-accent`, also on mouse click | 1 |
| Monaco | JetBrains Mono 13/20, syntax colours, `bg/base` | System font at 14, vs-dark colours, `bg-surface` | 1 |
| Components | 21 sets + Modal, Level Up Callout, App Bar; 22 icons | `Overlay`, `FileTree`, `TopicChip`, `SelectionCard`, `TextLink`, `Hotspot`, no `Button`/`Input`/`Icon`/badges | 2 |
| Panels | One tabbed window, one URL per tab (47:260) | `Overlay` with title and ×, no tabs | 3 |
| Top bar | App Bar: logo, breadcrumb, streak, LV/XP, avatar (46:9) | `RoomHud`: text, XP, streak, email, Profile, Log out | 3 |
| Profile | Standalone `/profile` (48:573) | Overlay; `/profile` redirects to `/room/profile` | 3 |
| Login | Split screen with logo and art (11:3) | Centred card | 4 |
| Onboarding | Stepper + Selection Card variants (11:25, 11:78, 11:139) | "Step n of 3" text | 4 |

**Screens in Figma:** sections 1–11 are all present: 1 Login/Onboarding, 2 Room, 3 Task Board, 4 Codebase, 5 Editor, 6a/6b VCS, 7a/7b Review, 8 Profile, 9 End of Day, 10a/10b Best on desktop, 11a–c Empty and error. The spec says all MVP screens are designed.

### Already decided in Figma
These are in Design Spec › 12 Decisions (48:573) or › 10–11, so this plan follows them instead of asking again:
- One tabbed panel window; tabs keep state; one URL per tab, including `/room/vcs`.
- Profile is a standalone page, not a panel tab.
- Text on solid accent uses `accent/ink`.
- Focus ring: 2px `info`, 2px offset, `:focus-visible`.
- Token and prop names (48:295): `--font-display`, `--shadow-overlay`, `<Button variant="primary|secondary|danger" disabled />`, `<StatusBadge status="APPROVED" />`.
- The room stays as placeholder art for the MVP, so the `--color-room-*` tokens stay code-only.

## Contrast
Calculated with the WCAG 2.1 formula from the Figma values. Figma's Design Spec table (45:315) agrees.

| Foreground on background | Ratio | Result |
|--------------------------|-------|--------|
| `text-primary` on `accent` (**all 7 primary buttons today**) | **2.09** | **Fails 4.5.** It was 4.89 on the old purple, so changing only the accent makes things worse |
| `text-primary` on `accent-hover` | **1.75** | **Fails** |
| `accent-ink` on `accent` / `accent-hover` | 8.01 / 9.56 | Passes: the fix |
| `accent-ink` on `danger` (Danger button hover) | 6.87 | Passes |
| `text-primary` on `bg-surface` / `bg-base` / `bg-elevated` | 16.43 / 17.55 / 14.86 | Passes |
| `text-muted` on `bg-surface` / `bg-elevated` | 7.64 / 6.90 | Passes |
| `accent` on `bg-surface` / `bg-elevated` (`TextLink`, HUD links) | 7.86 / 7.11 | Passes. Improves on the old 3.30 |
| `accent-on-subtle` on `accent-subtle` | 8.74 | Passes |
| `accent-hover` on `accent-subtle` (today's chips and tags) | 7.43 | Passes, but off-design |
| success / warning / danger / info on own `*-subtle` | 8.91 / 10.04 / 5.87 / 7.78 | Passes |
| `danger/20` tint (today's Hard badge) | 4.99 | Passes, replaced by `danger-subtle` |
| `info` ring on `bg-surface` | 9.59 | Passes 3.0 |
| `info` ring on `accent` | 1.22 | Fails if it touches the button, which is why the 2px offset matters |
| `border` / `border-strong` on `bg-surface` | 1.35 / 1.84 | **Under 3.0 for input boundaries** (D4) |

Disabled controls are exempt from WCAG contrast rules.

## Decisions for the owner
Please answer these before the stage that needs them. Each one has a recommendation you can simply accept.

### D1. How to load the fonts (Stage 1)
- **Self-host with `@fontsource-variable/*`.** The font files ship in our own build. *Pros:* works on the Tailscale-only staging and offline, as Monaco already does; no player data goes to Google; versions are pinned. *Cons:* three new dependencies and slightly larger deploy files.
- **Google Fonts link in `index.html`.** *Pros:* one line, no dependencies. *Cons:* breaks offline; every visit sends the player's IP to Google; a future strict security policy would have to allow Google's domains.
- **Recommendation: self-host.** It matches the decision already made for Monaco. Packages checked: 5.3.0, OFL-1.1 licence.

### D2. How to apply the focus ring (Stage 1)
- **One global rule in `index.css`** for `:focus-visible`. Remove the per-element focus classes. *Pros:* about 5 lines; every future element gets it automatically; nothing to forget. *Cons:* less explicit in each component; elements that need something different must opt out.
- **A class on every interactive element.** *Pros:* visible in each component. *Cons:* 14 copies today, easy to forget, and CONVENTIONS already warns against repeated class strings.
- **Recommendation: the global rule.**

### D3. How to express the 13 text styles (Stage 1)
- **Named tokens in `tokens.css`** (`text-label-m`, `text-h2`). *Pros:* same names as Figma; matches its "never set font or size by hand" rule; one place to change. *Cons:* about 40 more lines of tokens; existing code moves over gradually.
- **Keep Tailwind sizes** and add only the missing ones. `text-sm` is already 14/20 and `text-xs` is 12/16. *Pros:* fewer lines. *Cons:* names don't match Figma, and each component has to remember the right weight and spacing.
- **Recommendation: named tokens.** Migrate existing code when it's next touched, not in one sweep.

### D4. Input border contrast (Stage 2, decide in Figma)
The Input component uses `border/default` (1.35:1). The spec says inputs use `border/strong` (1.84:1, or 1.67:1 next to the input fill), and also that UI parts need 3:1.
- **Use `border-strong`.** *Pros:* matches the spec text, no new token. *Cons:* still under 3:1, though the label above helps people find the field.
- **Add a stronger input border that reaches 3:1.** *Pros:* meets the spec's own rule. *Cons:* a new token; a brighter look than the quiet design intends.
- **Recommendation: use `border-strong` now and log the exception in 12 · Decisions**, unless you want strict AA. In that case, change it in Figma first.

### D5. When to build the tabbed panel window (Stage 3)
Figma has already decided on the design, so this is only about timing.
- **Before Phase 4.** *Pros:* Editor and VCS are built once, in the right container. *Cons:* delays Phase 4 by one PR.
- **During Phase 4.** *Pros:* the tabs arrive with real content. *Cons:* mixes a shell refactor with a large feature, making that PR harder to review.
- **After Phase 4.** *Pros:* quickest start. *Cons:* the new panels get reworked straight away.
- **Recommendation: before Phase 4.**

### D6. Tabs for panels that don't exist yet (Stage 3)
- **Hide them until the route exists.** *Pros:* no dead controls; matches the SPEC line "Editor and Review are not linked until they exist". *Cons:* differs from Figma's five tabs for a while.
- **Show them disabled.** *Pros:* matches Figma and shows what's coming. *Cons:* dead controls in every session; needs a disabled Tab state, which Figma doesn't have.
- **Recommendation: hide them.**

### D7. App Bar content the product doesn't have yet (Stage 3)
Figma shows "LV 3 · 1,240 XP", but the API has no level and no doc defines level thresholds. The App Bar also has no place for Log out, which `RoomHud` has today.
- **Level.** Show XP only until levels exist (recommended), or define thresholds now, which is a backend and product change.
- **Log out.** Make the avatar open a small menu with email and Log out (recommended: closest to Figma, but needs a small design addition), or keep a plain Log out link in the bar (simplest, but not in the design).

### D8. Art on the Login screen (Stage 4)
- **Export the art from Figma as an SVG file.** *Pros:* matches the design; a simple static file. *Cons:* a second piece of art to keep up to date.
- **Reuse `RoomScene`.** *Pros:* no new asset. *Cons:* a different look, and it carries hotspot behaviour it doesn't need here.
- **No art at first.** *Pros:* smallest change. *Cons:* half the screen is empty.
- **Recommendation: export from Figma.**

### D9. How many primitives to build up front (Stage 2)
- **Only what has a current or next-phase use: six components.** *Pros:* small PRs; no untested guesses. *Cons:* the library grows over time.
- **All 24 now.** *Pros:* a complete set. *Cons:* much of it has no use until Phases 5–6, and it conflicts with "keep it simple".
- **Recommendation: six now, then build each one when a screen first needs it.**

### D10. How to ship the icons (Stage 2)
- **One `Icon` component with the Figma SVG paths inline.** *Pros:* no dependency; exact Figma shapes; colour follows the text. *Cons:* a small hand-maintained list.
- **An SVG build plugin (`vite-plugin-svgr`).** *Pros:* plain `.svg` files. *Cons:* one more dependency for 22 small icons.
- **An icon library such as lucide.** *Pros:* many icons. *Cons:* doesn't match Figma's custom set, and Figma says never to redraw icons.
- **Recommendation: one `Icon` component.**

### D11. Task files
AGENTS.md says tasks live in `docs/tasks`. **Recommendation:** treat these stage plans as the task spec and don't duplicate them. Say if you'd like a `docs/tasks/design/` folder as well.

## Phase 4 overlap
This plan doesn't cover Phase 4. It only sets what should exist before it starts, based on Screens 5 and 6.

| When | Items |
|------|-------|
| Before Phase 4 | Stage 1 tokens and Monaco theme. Stage 2 Button, Icon, Input, StatusBadge, Difficulty, Chip. Stage 3 shell (D5) |
| Built in Phase 4, on first use | Diff Line, Editor Tab, Criteria Item, File Tree Row, Toast, Modal |
| Phase 4 must plan for | "Tabs keep state": a route change unmounts the panel, so editor drafts must live outside it. The Unified/Split toggle (32:478) and the `M` file tag aren't in the component inventory yet. Commit message is two lines in 6a, so `Input` needs a multi-line mode |

## Out of scope
- **Owned by other cards:** ProtectedRoute bug, API hardening (including the 11 error states and `EmptyState`), structure refactor, Tooling, and [Vite leftovers](https://trello.com/c/TZCwWYmk), which has the favicon and page title.
- **Real dependencies on them:**
  - The structure refactor may move `components/`. Whichever lands second has to rebase, and new files follow the layout that exists then.
  - The favicon should use Stage 1's accent colour.
  - CONVENTIONS says lint enforces Tailwind class order, but `prettier-plugin-tailwindcss` isn't installed and `npm run lint` is oxlint. That belongs to Tooling; until then, order classes by hand.
- **Code Connect:** optional on the card and not justified at this size.
- **Phase 8:** the viewport warning (screens 10a and 10b).
- **Designed, but on no card:** Main Room hub (13:99), Kanban Task Board (14:182), Explorer details (15:241), Profile content (34:1183, mostly Phase 6), End of Day (37:1337). I recommend you open cards for these. I didn't create any.

## Risks
| Risk | Mitigation |
|------|------------|
| Primary buttons ship at 2.09:1 | Accent values and the `accent-ink` swap are in the same commit |
| Radius values silently change existing buttons | Same commit moves `rounded-lg` buttons to `rounded-md` |
| Monaco cursor drifts because the font loads late | Remeasure after the font loads, then check by typing in the editor |
| Monaco colours come back empty because Tailwind drops unused variables | `@theme static` |
| Space Grotesk widths break layouts | Check every panel at 1280px and 1440px |
| Conflicts with parallel worktrees | Keep PRs small, merge Stage 1 quickly, rebase before review |
| Figma changes during the work (Design Spec chapters 08–13 appeared during this review) | Re-read the relevant Figma frames at the start of each stage |
| Phase 4 starts before Stage 2 | This roadmap sets the order. Raise it if Phase 4 gets prioritised sooner |
| Design parity keeps growing | Each stage has a fixed list. New gaps become cards |

## Figma follow-ups for the owner
- Tokens note 7:100 says ink on accent ≈ 9:1 and state text ≥ 7:1. The real values are 8.01:1 and 5.87:1 for danger. The Design Spec table is right.
- Input stroke: component 8:55 and the spec table disagree (D4).
- Focus variants on Button and Input draw a 2px stroke with no gap, while 48:260 says 2px offset.
- Known gaps table in 48:295 is stale: "Panels are full pages, not overlays" is fixed and that card was renamed; "Only 4 of 24 components" is out of date.

## Definition of done
1. All four stage plans are complete, with their own done-when met.
2. No text on solid accent uses `text-text-primary`; the contrast table holds in the running app.
3. `tokens.css` matches the Figma semantic variables 1:1, apart from the code-only `room-*` tokens.
4. SPEC, CONVENTIONS and CHANGELOG describe what's actually built.
5. Trello cards and these plans agree on status, and each executed plan has an implementation record.

## References
- [Figma file](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb): Design Spec page 44:2, Design System page 5:2, Screens page 5:3
- `frontend/SPEC.md`, `CONVENTIONS.md`, `ROADMAP.md`
- https://tailwindcss.com/docs/theme
- https://www.w3.org/TR/WCAG21/#contrast-minimum
