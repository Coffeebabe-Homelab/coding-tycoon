# PLAN — Night Shift design implementation (roadmap)

## Context
Coding Tycoon is a game where the player does a developer's job. From a **room** (the hub), the player opens **panels**: tool windows over the room, each with its own URL under `/room`. Figma's design has five panel tabs: Task Board, Codebase, Editor, VCS and Review. Only Task Board and Codebase exist today.

**Phase 4** is the next feature phase in [`ROADMAP.md`](../../ROADMAP.md): the code editor and VCS panel. It adds the Editor and VCS tabs.

## Goal
Bring the frontend to the Night Shift tokens, fonts, shared `Button` and `Icon`, and the tabbed panel window before Phase 4, so Phase 4 doesn't add UI that has to be redone. The remaining design work ships separately and doesn't hold up Phase 4.

> This file is the plan for the design work. Each stage has its own plan, ships as its own PR and can be reviewed alone. Reviewed against `dev` 25b7bb0, [Figma](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb) and [`DESIGN_SPEC.md`](DESIGN_SPEC.md) on 2026-11-08. Nothing here is implemented yet.

**How to read this plan**
- **Stage** is a step of this plan. **Phase** is a step of `ROADMAP.md`.
- **Design Spec** is the Figma page 44:2, copied to [`DESIGN_SPEC.md`](DESIGN_SPEC.md). If they disagree, Figma wins. `frontend/SPEC.md` is the separate spec for the code.
- IDs like `48:573` are Figma nodes: add `?node-id=48-573` to the file URL.
- Tokens are named `accent/ink` in Figma, `--color-accent-ink` in CSS and `text-accent-ink` in classes (Design Spec § 11, Token mapping). Tables here use the short name, `accent-ink`.

## Stages

| # | Stage | Plan | Trello | Depends on | Needed before Phase 4? |
|---|-------|------|--------|------------|------------------------|
| 1 | Foundation: tokens, contrast, focus, fonts, Monaco theme, docs | [foundation](PLAN-design-foundation.md) | [tokens](https://trello.com/c/WgHECfmr), [fonts](https://trello.com/c/JBsXyvW1), [docs](https://trello.com/c/uFtgKnQ2) | D1–D3 | Yes |
| 2 | Primitives: `Button`, `Icon`, `Difficulty`, `StatusBadge` | [primitives](PLAN-design-primitives.md) | [primitives](https://trello.com/c/Bu7ggkjA) | Stage 1, D9, D10 | `Button` and `Icon` only |
| 3 | Tabbed panel window | [shell, part A](PLAN-design-shell.md) | [card 37](https://trello.com/c/otnwbry7), split when picked up | `Button`, `Icon` | Yes |
| – | App Bar and standalone Profile | [shell, part B](PLAN-design-shell.md) | [App Bar and Profile](https://trello.com/c/Jgp2Utrw) | Stage 3, D7 | No. No later than Phase 6's Profile work |
| 4 | Login and onboarding, including `Chip` | [screens](PLAN-design-screens.md) | [routes](https://trello.com/c/LXw2xTF7) | Stage 2, D8 | No |

```
Stage 1 ──▶ Stage 2 (Button, Icon) ──▶ Stage 3 (PanelWindow) ──▶ Phase 4
                 │                          └──▶ App Bar and Profile (any time after Stage 3)
                 └──▶ Stage 4 (any time after Stage 2)
```

**Why this order**
- Tokens come first because every later component uses them, and the accent colour can't change without the text fix.
- `Button` and `Icon` come next, or Phase 4 copies the button class strings again.
- The panel window comes before Phase 4 because the Editor and VCS are new tabs inside it.
- Doing all the design work first would delay the game loop for screens Phase 4 doesn't use, against "Build the loop first, polish the world second" (`north_star.md`). Doing none of it first means Phase 4 is built in `Overlay` with the old tokens, then rebuilt.

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
| Monaco | JetBrains Mono 13/20, syntax colours, `bg-base` | System font at 14, vs-dark colours, `bg-surface` | 1 |
| Components | 21 sets + Modal, Level Up Callout, App Bar; 22 icons | `Overlay`, `FileTree`, `TopicChip`, `SelectionCard`, `TextLink`, `Hotspot`, no `Button`/`Input`/`Icon`/badges | 2, then first use (D9) |
| Panels | One tabbed window, one URL per tab (47:260) | `Overlay` with title and ×, no tabs | 3 |
| Top bar | App Bar: logo, breadcrumb, streak, LV/XP, avatar (46:9) | `RoomHud`: text, XP, streak, email, Profile, Log out | App Bar card |
| Profile | Standalone `/profile` (Design Spec › 12 · Decisions) | Overlay; `/profile` redirects to `/room/profile` | App Bar card |
| Login | Split screen with logo and art (11:3) | Centred card | 4 |
| Onboarding | Stepper + Selection Card variants (11:25, 11:78, 11:139) | "Step n of 3" text | 4 |

**Screens in Figma:** sections 1–11 are all present: 1 Login/Onboarding, 2 Room, 3 Task Board, 4 Codebase, 5 Editor, 6a/6b VCS, 7a/7b Review, 8 Profile, 9 End of Day, 10a/10b Best on desktop, 11a–c Empty and error. The Design Spec says all MVP screens are designed.

### Already decided in Figma
These come from the Design Spec, so this plan follows them instead of asking again:
- One tabbed panel window (§ 12 · Decisions); tabs keep state and one URL per tab, including `/room/vcs` (§ 08 Patterns). See "What Stage 3 guarantees" for how far the code goes in this plan.
- Profile is a standalone page, not a panel tab (§ 12).
- Text on solid accent uses `accent-ink` (§ 12).
- Focus ring: 2px `info`, 2px offset, `:focus-visible` (§ 10).
- Token and prop names (§ 11, 48:295): `--font-display`, `--shadow-overlay`, `<Button variant="primary|secondary|danger" disabled />`, `<StatusBadge status="APPROVED" />`.
- The room stays as placeholder art for the MVP (§ 12).

**This plan's own decision:** the `--color-room-*` tokens stay code-only. The Design Spec maps tokens 1:1 and doesn't mention them, but they colour placeholder art that Figma doesn't define.

### What Stage 3 guarantees
"Tabs keep state" (§ 08) means switching tabs never loses work. The owner's rule (2026-11-08) is stronger: **a tab always starts from where it was left**, after a tab switch and after closing and reopening the panel, within one session.
- `PanelWindow` is one pathless layout route under `/room`, so it stays mounted for the whole time the player is in the room. Tab links use `replace`, so Back still closes the panel.
- Leaving a tab hides its page instead of removing it, using React's `<Activity>`. Expanded folders, scroll position, the open file and anything else on the page stay as they were, for every tab, with no code in each panel.
- Opening Codebase without `?file=`, from a tab or the room hotspot, reopens the last file.
- Data still refreshes when a tab comes back, so a new task doesn't show the old codebase.
- A page refresh starts fresh. Keeping drafts across one is on the [backlog](https://trello.com/c/ylqNEdV2).

Stage 3 starts by proving this works with Monaco and scroll position. Anything the proof shows isn't kept gets saved by hand.

## Contrast
Calculated with the WCAG 2.1 formula from the Figma values. The Design Spec table (45:315) agrees for the pairs it lists. Text needs 4.5:1. UI parts need 3:1. Disabled controls are exempt. The full table is in the [foundation plan](PLAN-design-foundation.md#contrast).

| Foreground on background | Ratio | Result |
|--------------------------|-------|--------|
| `text-primary` on `accent` (every solid accent control today) | **2.09** | **Fails.** Changing only the accent takes it from 4.89 to 2.09 |
| `accent-ink` on `accent` / `accent-hover` | 8.01 / 9.56 | Passes: the fix |
| `info` ring on `accent` | 1.22 | Fails if it touches the button, which is why the 2px offset matters |
| `border` / `border-strong` on `bg-surface` | 1.35 / 1.84 | Under the Design Spec's 3:1 rule for UI parts (D4) |

## Decisions for the owner
Each decision has a recommendation you can accept. A stage doesn't start until its decisions are answered. Record each answer under its heading here. D10 and D11 are open now. D7, D8 and D9 can wait for their work.

**Answered on 2026-11-08**
- `RoomHud` can stay above the panel window until the App Bar card ships.
- Editor drafts don't have to survive a page refresh. It's desirable, so it's on the [backlog](https://trello.com/c/ylqNEdV2). Screen 5 keeps its "Auto-saved" label, which isn't implemented until that card ships.
- `EmptyState` belongs to the [Resilience card](https://trello.com/c/d6v9NYfk).
- Tabs always start from where they were left, by keeping them alive (see "What Stage 3 guarantees").

### D1. How to load the fonts (Stage 1)
- **Self-host with `@fontsource-variable/*`.** The font files ship in our own build. *Pros:* pages don't depend on reaching Google, so it works offline, as Monaco already does; no player data goes to Google; versions are pinned. *Cons:* three new dependencies, and three font files added to the deploy.
- **Google Fonts link in `index.html`.** *Pros:* one line, no dependencies. *Cons:* breaks offline; every visit sends the player's IP to Google; a future strict security policy would have to allow Google's domains.
- **Decided 2026-11-08: self-host.** Monaco is already bundled locally. Packages checked: 5.3.0, OFL-1.1 licence.

### D2. How to apply the focus ring (Stage 1)
- **One global rule in `index.css`** for `:focus-visible`. Remove the per-element focus classes. *Pros:* one rule replaces 22 lines of focus classes in 13 files; every future element gets it automatically. *Cons:* less explicit in each component; elements that need something different must opt out; it goes against the mandatory `hover:` and `focus:` pairing in `CONVENTIONS.md`, so Stage 1 must rewrite that rule in both places it appears.
- **A class on every interactive element.** *Pros:* visible in each component. *Cons:* 22 lines today, easy to forget, and `CONVENTIONS.md` already warns against repeated class strings.
- **Decided 2026-11-08: the global rule.**

### D3. How to express the 13 text styles (Stage 1)
- **Named tokens in `tokens.css`** (`text-label-m`, `text-h2`). *Pros:* same names as Figma; size, line height, weight and spacing come from one class. *Cons:* about 40 more lines of tokens; existing code moves over gradually; `--text-*` can't carry the font family, so Display and Code styles also need `font-display` or `font-mono`.
- **Keep Tailwind sizes** and add only the missing ones. `text-sm` is already 14/20 and `text-xs` is 12/16. *Pros:* fewer lines. *Cons:* names don't match Figma, and each component has to remember the right weight and spacing.
- **Decided 2026-11-08: named tokens.** Migrate existing code when it's next touched, not in one sweep.

### D4. Input border contrast (Phase 4, when `Input` is built)
Stage 2 no longer needs this: `Input` has no user until Phase 4. The Input component uses `border` (1.35:1). The Design Spec says inputs use `border-strong` (1.84:1, or 1.67:1 next to the input fill), and also that UI parts need 3:1.
- **Use `border-strong`.** *Pros:* matches the Design Spec text, no new token. *Cons:* still under 3:1, though the label above helps people find the field.
- **Add a stronger input border that reaches 3:1.** *Pros:* meets the Design Spec's own rule. *Cons:* a new token; a brighter look than the quiet design intends.
- **Decided 2026-11-08: use `border-strong` as a temporary exception**, logged in 12 · Decisions when `Input` is built. [This bug card](https://trello.com/c/ekVyPo8p) fixes it in Figma. Once that's done, the owner opens a card for the code.

### D5. When to build the tabbed panel window (Stage 3)
Figma has already decided on the design, so this is only about timing. It covers the window only: the App Bar and Profile don't block Phase 4 under any answer.
- **Before Phase 4.** *Pros:* Editor and VCS are built once, in the right container. *Cons:* delays Phase 4 by one PR, which now includes keeping tabs alive.
- **During Phase 4.** *Pros:* the tabs arrive with real content. *Cons:* mixes a shell refactor with a large feature, making that PR harder to review.
- **After Phase 4.** *Pros:* quickest start. *Cons:* the new panels get reworked straight away.
- **Decided 2026-11-08: before Phase 4.**

### D6. Tabs for panels that don't exist yet (Stage 3)
Task Board and Codebase exist. Editor, VCS and Review don't.
- **Hide them until the route exists.** *Pros:* no dead controls; matches the `frontend/SPEC.md` line "Editor and Review are not linked until they exist". *Cons:* differs from Figma's five tabs until those routes ship.
- **Show them disabled.** *Pros:* matches Figma and shows what's coming. *Cons:* dead controls in every session; needs a disabled Tab state, which Figma doesn't have.
- **Decided 2026-11-08: hide them.**

### D7. App Bar content the product doesn't have yet (App Bar card)
Figma shows "LV 3 · 1,240 XP", but the API has no level and no doc defines level thresholds. The level model has no owner yet and is listed on [card 37](https://trello.com/c/otnwbry7). The App Bar also has no place for Log out, which `RoomHud` has today.
- **Level. Decided 2026-11-08:** show the placeholder "LV X" next to the real total XP, as in "LV X · 1,240 XP". No level model or thresholds are decided yet, so there's no backend change. The real number replaces `X` once the level model on card 37 exists.
- **Log out.** Make the avatar open a small menu with email and Log out. *Pros:* closest to Figma. *Cons:* needs a small design addition. Or keep a plain Log out link in the bar. *Pros:* simplest. *Cons:* not in the design. **Recommendation: the menu.**

### D8. Art on the Login screen (Stage 4)
- **Export the art from Figma as an SVG file.** *Pros:* matches the design; a simple static file. *Cons:* a second piece of art to keep up to date.
- **Reuse `RoomScene`.** *Pros:* no new asset. *Cons:* a different look, and it carries hotspot behaviour it doesn't need here.
- **No art at first.** *Pros:* smallest change. *Cons:* half the screen is empty.
- **Recommendation: export from Figma.**

### D9. How many primitives to build up front (Stage 2)
- **Only what has a current use: four components, then each one on first use.** `Chip` comes with Stage 4 and `Input` with Phase 4. *Pros:* small PRs; no untested guesses. *Cons:* the library grows over time.
- **All 24 now.** *Pros:* a complete set. *Cons:* many have no use until Phases 5–6, and it adds code nothing tests in real use.
- **Recommendation: four now, then first use.** The remaining Figma components follow this rule and stay on the [primitives card](https://trello.com/c/Bu7ggkjA).

### D10. How to ship the icons (Stage 2)
- **One `Icon` component with the Figma SVG paths inline.** *Pros:* no dependency; exact Figma shapes; colour follows the text. *Cons:* a small hand-maintained list.
- **An SVG build plugin (`vite-plugin-svgr`).** *Pros:* plain `.svg` files. *Cons:* one more dependency for 22 small icons.
- **An icon library such as lucide.** *Pros:* many icons. *Cons:* doesn't match Figma's custom set, and Figma says never to redraw icons.
- **Recommendation: one `Icon` component.**

### D11. Task files (blocks nothing)
`AGENTS.md` says tasks live in `docs/tasks`. **Recommendation:** treat these stage plans as the task spec and don't duplicate them. *Cost:* design tasks sit in `docs/design/`, not where `AGENTS.md` says to look. The other option is a `docs/tasks/design/` folder that points to these plans.

## Phase 4 overlap
This plan doesn't cover Phase 4. It sets what must exist first and lists what Phase 4 must plan for, based on Screens 5 and 6. The gate is recorded in `ROADMAP.md`.

| When | Items |
|------|-------|
| Before Phase 4 | Stage 1 tokens and Monaco theme. `Button`. `Icon` (including `x` and `arrow-left`). `PanelWindow` |
| Built in Phase 4, on first use | `Input` with its multi-line mode (D4), Diff Line, Editor Tab, Criteria Item, Toast. Extend `FileTree` for File Tree Row. Extend `Overlay` for Modal, which is used only for consequential actions such as "Push to review?" (`DESIGN_SPEC.md` § 08, Confirmations & loading). `StatusBadge` and `Difficulty` must exist by Screen 5 |
| Phase 4 must plan for | **Drafts** must survive tab switches and closing the panel. Stage 3 keeps the Editor tab alive, so Phase 4 confirms this in the editable Monaco and closes any gap the Stage 3 proof found. Surviving a refresh is on the [backlog](https://trello.com/c/ylqNEdV2). Screen 5's "Auto-saved" label stays in Figma as the design, but Phase 4 doesn't show it: that card implements both. **Editable Monaco** captures Tab and needs a keyboard way out, and Esc must not close the panel while the editor uses it. Screen 5's gutter markers, autocomplete and status bar. The Unified/Split toggle (32:478) and the `M` file tag aren't in the component inventory yet |

## Out of scope
- **Owned by other cards:** [API hardening](https://trello.com/c/d6v9NYfk), which has the error boundary and now `EmptyState` (Screens 11a and 11c); [structure refactor](https://trello.com/c/4PkCp3Rg); [Tooling](https://trello.com/c/DQ8qs1Dv); and [Vite leftovers](https://trello.com/c/TZCwWYmk), which has the favicon and page title.
- **Owned by Phase 5:** Screen 11b and "our failures never cost an attempt".
- **Real dependencies on them:**
  - The structure refactor card doesn't list a `components/` move today. If one is added, whichever lands second has to rebase, and new files follow the layout that exists then.
  - The favicon should use Stage 1's accent colour.
  - `prettier-plugin-tailwindcss` isn't installed, so nothing checks Tailwind class order. Order classes by hand, as `CONVENTIONS.md` says.
- **Code Connect** (Figma's link from components to code): optional on the primitives card and not justified at this size.
- **Phase 8:** the viewport warning (screens 10a and 10b).
- **Designed, tracked on [card 37](https://trello.com/c/otnwbry7), split when picked up:** Main Room hub (13:99), which includes the P hotspot and the T and P shortcuts; Kanban Task Board (14:182); Explorer details (15:241); Profile content (34:1183, mostly Phase 6); End of Day (37:1337); the level model.

## Risks
| Risk | Mitigation |
|------|------------|
| Solid accent buttons ship at 2.09:1 | Accent values and the `accent-ink` swap are in the same commit, and a search finds every control |
| Radius values silently change existing buttons | Same commit moves `rounded-lg` buttons to `rounded-md` |
| Monaco cursor drifts because the font loads late | Remeasure after the font loads, then check by typing in the editor |
| Monaco colours come back empty because Tailwind drops unused variables | `@theme static` |
| Space Grotesk widths break layouts | Check every panel at 1280px and 1440px |
| Conflicts with parallel worktrees | Keep PRs small and rebase before review |
| Keeping tabs alive is unproven. Hiding a tab runs its cleanup code, which may destroy Monaco, and browsers may not keep scroll on hidden elements | Stage 3 starts with a proof covering folders, scroll and Monaco. Anything not kept is saved by hand |
| Kept tabs use more memory | Only tabs the player has visited are kept. Check Monaco's memory use once the Editor exists |
| Standalone Profile sits outside `/room`, so going there would drop kept tabs | Part B of the shell plan must solve this before it ships |
| `RoomHud` sits above a window measured for the App Bar, against an accepted decision | Accepted by the owner until the App Bar card ships. Stage 3 checks it fits |
| Figma changes during the work | Re-read the relevant Figma frames at the start of each stage, and update `DESIGN_SPEC.md` in the same PR |
| Phase 4 starts before the gate | `ROADMAP.md` Phase 4 names the gate. Raise it if Phase 4 gets prioritised sooner |
| Design parity keeps growing | Each stage has a fixed list. New gaps become cards |

Security and scale don't apply to a reskin, apart from D1's privacy point. Rollback for any stage is a revert of its PR.

## Figma follow-ups for the owner
- Tokens note 7:100 says ink on accent ≈ 9:1 and state text ≥ 7:1. The real values are 8.01:1 and 5.87:1 for danger. The Design Spec table is right.
- Input stroke: component 8:55 and the Design Spec table disagree (D4). Tracked on [this bug card](https://trello.com/c/ekVyPo8p).
- Focus variants on Button and Input draw a 2px stroke with no gap, while 48:260 says 2px offset.
- Known gaps table in 48:295 is stale. "Panels are full pages, not overlays; no VCS route": the overlay half is fixed, the VCS route is still open, and that card was renamed. "Only 4 of 24 components" is out of date.

## Definition of done
This covers Stages 1–3. The App Bar card and Stage 4, including `Chip`, are tracked on their own.
1. Stages 1, 2 and 3 meet their own done-when.
2. A search for solid `bg-accent` finds no element using `text-text-primary`. `accent-ink` on `accent` measures 8.01:1 in dev tools, and the pairs in `DESIGN_SPEC.md` § 03 hold for every control built.
3. Every Figma semantic variable has a token in `tokens.css` with the same value, named per Design Spec § 11. The only extras are the code-only `--color-room-*` and `--drop-shadow-hotspot`.
4. `frontend/SPEC.md` routing matches `App.tsx`, neither `frontend/SPEC.md` nor `CONVENTIONS.md` mentions placeholder branding, and `CHANGELOG.md` has an entry for each stage.
5. Each stage's Trello cards are in the lane `AGENTS.md` requires. Each executed stage plan names its merged PR and date at the top, as its implementation record.
6. Any change to the design gets a row in 12 · Decisions, and `DESIGN_SPEC.md` is updated in the same PR. Code that is only catching up with an accepted design doesn't need a row.

## References
- [Figma file](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb): Design Spec page 44:2, Design System page 5:2, Screens page 5:3
- [`DESIGN_SPEC.md`](DESIGN_SPEC.md): repo copy of the Design Spec
- [`frontend/SPEC.md`](../../frontend/SPEC.md), [`CONVENTIONS.md`](../../CONVENTIONS.md), [`ROADMAP.md`](../../ROADMAP.md), [`AGENTS.md`](../../AGENTS.md)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme)
- [WCAG 2.1 contrast minimum](https://www.w3.org/TR/WCAG21/#contrast-minimum)
