# Coding Tycoon Design Spec

> **Copy of the [Design Spec page in Figma](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=44-2), so the spec is readable without Figma access.**
>
> - **Figma is the source of truth.** If this file and Figma disagree, Figma wins.
> - **Copied on:** 2026-11-08. The Figma page was last updated on 2026-11-08.
> - **Not included:** live component previews, colour swatches, icon artwork and the screen designs. Open Figma for those.
> - **Keeping it current:** when the Figma page changes, update this file in the same PR.

## 00 · Design Spec — read me first

The source of truth for how Coding Tycoon looks, reads and behaves. Designers and developers both work from this page. If a screen and this spec disagree, fix one of them and log it in [12 · Decisions](#12--decisions).

### Quick facts

| Topic | Value |
| --- | --- |
| Status | MVP screens 1–11 designed (all routes + empty/error states). Code implementation in progress. |
| Brand direction | Night Shift — dark theme only for the MVP. |
| Reference frame | 1440 × 900 desktop. Minimum supported width 1280px. |
| Fonts | Pixelify Sans (game moments) · Space Grotesk (UI) · JetBrains Mono (code). |
| Tokens in code | `frontend/src/styles/tokens.css` — Tailwind v4 `@theme`, mirrors the Figma variables 1:1 |
| Product vision | `north_star.md` (repo + Claude project) · delivery plan: `ROADMAP.md` |
| Work tracking | Trello board “Coding Tycoon” — design work as “Figma: …” cards |
| Last updated | 2026-11-08 |

### File map

Four pages. Never put screens on the Design System page or components on the Screens page.

| Page | Contains | Use it for |
| --- | --- | --- |
| Design Spec | This document: principles, tokens, patterns, screens, decisions | Read before designing or building any UI |
| Cover / Direction Options | Night Shift (chosen) plus the rejected Pixel Cozy and Terminal Garden directions | Brand history and rationale |
| Design System | Tokens frame (variables, text & effect styles, icons) · Components frame (21 component sets + Modal, Level Up Callout, App Bar) | Building screens; developer handoff (Dev Mode) |
| Screens | Sections 1–11, one per screen; 1440 × 900 frames, states as lettered frames (6a, 6b…) | Reference design for every route and state |

### Contents

| No. | Chapter | What’s inside | Figma |
| --- | --- | --- | --- |
| 01 | [Principles](#01--principles) | The six rules every design decision is checked against | [44:217](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=44-217) |
| 02 | [Brand & voice](#02--brand--voice) | Night Shift, logo, personas, writing rules | [44:246](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=44-246) |
| 03 | [Color](#03--color) | Semantic tokens, status mappings, syntax colours, contrast | [45:2](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=45-2) |
| 04 | [Typography](#04--typography) | 13 text styles and when to use each font | [45:453](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=45-453) |
| 05 | [Spacing, radius & elevation](#05--spacing-radius--elevation) | 4-pt scale, corner radii, shadows | [45:607](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=45-607) |
| 06 | [Layout & breakpoints](#06--layout--breakpoints) | App Bar, panel window, sidebars, viewport rules | [46:2](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=46-2) |
| 07 | [Components](#07--components) | Inventory, variants and usage rules for all 24 components | [46:151](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=46-151) |
| 08 | [Patterns](#08--patterns) | Panels, code surfaces, review loop, rewards, toasts, empty/error states | [47:260](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=47-260) |
| 09 | [Screens & flow](#09--screens--flow) | Screen ↔ route map and the core gameplay flow | [47:510](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=47-510) |
| 10 | [Accessibility](#10--accessibility) | Contrast, focus, keyboard, motion | [48:260](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=48-260) |
| 11 | [Handoff & naming](#11--handoff--naming) | Figma → code token mapping, naming conventions, known gaps | [48:295](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=48-295) |
| 12 | [Decisions](#12--decisions) | Log of design decisions and why | [48:573](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=48-573) |
| 13 | [Open questions](#13--open-questions) | Undecided topics | [48:743](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=48-743) |

### How to change the design

1. **Tokens first** — change values in Design System → Variables, then update `tokens.css` in the same PR. Never hard-code a colour or size on a screen.
2. **Components second** — edit the main component, never detach instances on screens to “fix” them.
3. **Screens third** — add new states as lettered frames next to the original (e.g. 7a, 7b).
4. **Log it** — add a row to 12 · Decisions and update the relevant chapter here.

## 01 · Principles

Every design decision is checked against these six rules. They come from `north_star.md` and from building screens 1–11.

1. **Simulate, don’t simplify.** The UI mirrors the tools of a real job: Kanban board, IDE, git diff, pull-request review. Use real vocabulary (commit, push, branch, diff), never “submit answer”.
2. **Feedback is the product.** Review verdicts, comments and acceptance criteria get the most visual weight. Never hide why something failed — always point to the file and line.
3. **A game, not a CRUD app.** The room is the hub; tools open as panels over it. Progress is visible everywhere: XP, level, streak, level-ups.
4. **Calm work, loud rewards.** Tool surfaces are quiet and dense. Pixelify, accent glow and celebration copy are reserved for game moments (XP, level-ups, end of day).
5. **A daily habit of 15–30 minutes.** Every screen makes the next step obvious and shows effort (“~20 min · +120 XP”). Each day ends with closure (End of Day).
6. **Honest and kind.** Show penalties transparently (+0 first-try bonus) but never blame. Failures on our side (AI offline, app errors) never cost the player an attempt or progress.

## 02 · Brand & voice

Night Shift: a developer’s room late in the evening — deep violet surfaces, a warm desk-lamp orange and cyan monitor glow. Chosen over Pixel Cozy and Terminal Garden (see Cover page).

### Logo

The wordmark is text, not an image.

**CODING TYCOON** — Pixelify Sans Medium 20 · uppercase · `accent/default` · top-left of the App Bar. Never outline, recolour, stretch or place it on a light background.

### Personas

Three voices speak in the game. Keep them distinct.

| Voice | Where | Tone & example |
| --- | --- | --- |
| Manager | Daily standup, Task Board, tickets | Brief, friendly, sets context. “Evening shift. One ticket on the board.” |
| Senior Dev | Review Panel, tips, comments | Specific and constructive, cites file:line, praises good work. “Clean: mapping the Optional straight to 200/404 keeps the controller thin.” |
| The game | XP, level-ups, End of Day, empty states | Short and celebratory, never sarcastic. “Shift complete!” “Levelled up” |

### Writing rules

**Do**

- Sentence case for all UI text. Uppercase only through the Overline style.
- Second person, active voice: “You shipped CT-104.”
- Be specific with numbers: “~20 min · +120 XP”, “Retrying in 28s”.
- Name the next step on every screen: “Fix in editor”, “Log off for today”.
- Errors say what happened, whether work is safe, and what to do next.
- Use the typographic characters: … (ellipsis), — (aside), · (metadata separator), → (transition, e.g. Level 3 → 4).

**Don’t**

- Title Case Buttons Or ALL CAPS sentences.
- Passive or system voice: “Task was completed successfully.”
- Vague time or reward: “soon”, “some XP”.
- Blame the player for our failures (“You lost connection”).
- Quiz language: “answer”, “level failed”, “wrong!”.
- Exclamation marks outside game moments.

### Identifiers

Anything a developer would copy is set in a Code style.

| Thing | Format | Example |
| --- | --- | --- |
| Ticket key | `CT-NNN` | `CT-104` |
| Commit hash | 7 characters | `a1f3c9e` |
| Branch | `feat/CT-NNN-short-name` | `feat/CT-104-users-api` |
| Code reference | `File.java:line` | `UserController.java:30` |
| Error reference | `AREA-XXXX` | `RV-7F3A` · `FE-2C91` |

## 03 · Color

Two variable collections: Primitives (raw palette, named after the room: night, lavender, lamp, glow, mint, amber, rose) and Color (semantic tokens). Screens and components only ever use the Color collection. Dark theme only for the MVP.

> **Rule:** Bind every fill and stroke to a semantic token. Never use a Primitive or a raw hex on a screen or component. To rebrand, re-point the semantic tokens at new primitives.

### Surfaces & borders

| Token | Hex | Primitive | Use |
| --- | --- | --- | --- |
| `bg/base` | `#0B0918` | night/950 | Page and room background |
| `bg/surface` | `#141127` | night/900 | Panels, cards, modals, App Bar |
| `bg/elevated` | `#1E1A38` | night/800 | Inputs, rows, hover, active editor line |
| `border/default` | `#2E2852` | night/700 | Dividers, card and panel strokes |
| `border/strong` | `#433B70` | night/600 | Overlays, empty progress dots |
| `border/input` | `#6C6494` | night/500 | Default input strokes |

### Accent

| Token | Hex | Primitive | Use |
| --- | --- | --- | --- |
| `accent/default` | `#FF8A3D` | lamp/500 | Primary buttons, active tab, logo, cursor, XP |
| `accent/hover` | `#FFA366` | lamp/400 | Hover state; code keywords |
| `accent/subtle` | `#3D2214` | lamp/900 | Selected rows & chips, Submitted badge |
| `accent/on-subtle` | `#FFB98A` | lamp/300 | Text on accent/subtle |
| `accent/ink` | `#1B0F06` | lamp/ink | Text and icons on solid accent |

### Feedback

| Token | Hex | Primitive | Use |
| --- | --- | --- | --- |
| `info/default` | `#4CC9F0` | glow/400 | Focus ring, Assigned, Suggestion, code types |
| `info/subtle` | `#0E2A36` | glow/950 | Tips, Assigned badge, diff hunk rows |
| `success/default` | `#4BE3A0` | mint/400 | Approved, Praise, added lines, strings |
| `success/subtle` | `#0F2E24` | mint/950 | Success backgrounds, added-line tint |
| `warning/default` | `#FFD166` | amber/300 | In Progress, delays, TODOs, annotations |
| `warning/subtle` | `#33280F` | amber/950 | Warning backgrounds |
| `danger/default` | `#FF6B81` | rose/400 | Changes requested, Must fix, removed lines, errors |
| `danger/subtle` | `#3A1520` | rose/950 | Error backgrounds, removed-line tint |

### Text & decorative

| Token | Hex | Primitive | Use |
| --- | --- | --- | --- |
| `text/primary` | `#F3F0FF` | lavender/50 | Headings and body text |
| `text/muted` | `#A9A2C9` | lavender/300 | Secondary text, meta, line numbers |
| `rgb/magenta` | `#E84DF5` | rgb/magenta | Room RGB lighting only (decorative) |
| `rgb/violet` | `#7B5CFF` | rgb/violet | Room RGB lighting only (decorative) |

### State mappings

Use these pairs exactly: a `*/subtle` background with its `*/default` foreground. Status is never shown by colour alone — always with a label, dot, sign or icon.

| Concept | Value | Tokens |
| --- | --- | --- |
| Task status | Assigned | `info/subtle` + `info/default` |
| Task status | In Progress | `warning/subtle` + `warning/default` |
| Task status | Submitted | `accent/subtle` + `accent/on-subtle` |
| Task status | Approved | `success/subtle` + `success/default` |
| Task status | Changes Requested | `danger/subtle` + `danger/default` |
| Difficulty | Easy · Medium · Hard | success · warning · danger |
| Review severity | Must fix · Suggestion · Praise | danger · info · success |
| Diff lines | Added · Removed · Hunk · Context | `success/subtle` tint + “+” · `danger/subtle` tint + “−” · `info/subtle` · no tint |
| Empty/error tone | Nothing to do · Temporary · Unexpected | success · warning · danger |
| Toast | Loading · Success · Error · Info | info (sparkle) · success · danger · info |

### Code syntax colours

Used in the Codebase Explorer, Editor, VCS diff and review threads. Code/M (13/20) on `bg/base`.

| Token type | Colour | Example |
| --- | --- | --- |
| Keyword | `accent/hover` | `public final class return import` |
| Type / class name | `info/default` | `ResponseEntity  UserService  Long` |
| Annotation | `warning/default` | `@RestController  @Valid` |
| String | `success/default` | `"/api/users"` |
| Comment / TODO | `text/muted` | `// TODO: validate the body` |
| Everything else | `text/primary` | `userService.findById(id)` |

### Contrast (WCAG 2.1, calculated from the token values)

Body text needs ≥ 4.5:1, large text and UI parts ≥ 3:1.

| Foreground | Background | Ratio | Verdict |
| --- | --- | --- | --- |
| `text/primary` | `bg/surface` | 16.4 : 1 | Pass — body text |
| `text/muted` | `bg/surface` | 7.6 : 1 | Pass — body text |
| `text/muted` | `bg/elevated` | 6.9 : 1 | Pass — body text |
| `accent/ink` | `accent/default` | 8.0 : 1 | Pass — body text |
| `text/primary` | `accent/default` | 2.1 : 1 | Fail — never use for text |
| `accent/on-subtle` | `accent/subtle` | 8.7 : 1 | Pass — body text |
| `success/default` | `success/subtle` | 8.9 : 1 | Pass — body text |
| `warning/default` | `warning/subtle` | 10.0 : 1 | Pass — body text |
| `danger/default` | `danger/subtle` | 5.9 : 1 | Pass — body text |
| `info/default` | `info/subtle` | 7.8 : 1 | Pass — body text |
| `info/default` | `bg/surface` | 9.6 : 1 | Pass — body text |
| `border/input` | `bg/surface` | 3.4 : 1 | Pass — UI part |
| `border/input` | `bg/elevated` | 3.1 : 1 | Pass — UI part |

> **Text on a solid accent:** Use `accent/ink` on `accent/default` (primary buttons, today’s streak dot). `text/primary` on accent fails contrast. The current frontend uses `text-primary` on `bg-accent`; Trello tracks the fix.

## 04 · Typography

Thirteen text styles, three families, strict roles. Never set font, size or line height by hand — apply a style.

| Family | Specimen | Role |
| --- | --- | --- |
| Pixelify Sans | LV 3 · 1,240 XP | Game moments only: logo, XP, levels, celebration titles, stat values. |
| Space Grotesk | Implement the Users REST controller | All UI: headings, body, labels, buttons. |
| JetBrains Mono | `feat/CT-104-users-api` | Anything a developer would read or copy: code, paths, hashes, ticket keys, refs. |

### Type ramp

Spec format: family and weight · size/line height · letter spacing.

| Style | Specimen | Spec | Use for |
| --- | --- | --- | --- |
| Display/XL | Level 4 | Pixelify Sans Bold · 48/56 | Full-screen level-up takeover, hero numbers |
| Display/L | Shift complete! | Pixelify Sans SemiBold · 32/40 | Celebration titles |
| Display/M | +120 XP | Pixelify Sans Medium · 20/28 | XP values, stat tile numbers, “+120 XP” |
| Heading/H1 | Developer profile | Space Grotesk Bold · 28/36 · −0.5 | Page titles |
| Heading/H2 | Changes requested | Space Grotesk Bold · 20/28 · −0.25 | Section titles, verdicts, empty-state titles |
| Heading/H3 | Key strengths | Space Grotesk Medium · 16/24 | Panel and card titles |
| Body/L | Add the endpoints to UserController. | Space Grotesk Regular · 16/24 | Lead paragraphs, ticket descriptions |
| Body/M | Follow the patterns in ProductController. | Space Grotesk Regular · 14/20 | Default body text |
| Label/M | Review changes | Space Grotesk Medium · 14/20 | Buttons, row labels, names |
| Label/S | 2 attempts · 34 min | Space Grotesk Medium · 12/16 | Meta, helper text, badges, status bar |
| Overline | ACCEPTANCE CRITERIA | Space Grotesk Bold · 12/16 · +1.2 · uppercase | Section kickers. Type the text in capitals. |
| Code/M | `return ResponseEntity.ok(user);` | JetBrains Mono Regular · 13/20 | Editor, viewer and diff code |
| Code/S | `UserController.java:30` | JetBrains Mono Regular · 12/16 | Paths, hashes, ticket keys, refs |

### Rules

- **Pixelify never for body copy** — it is a display face; nothing longer than about six words.
- **One Display style per screen** — rewards should stand out, not compete.
- **Line length** — keep body text under ~72 characters per line (max-width ~640px at Body/L).
- **Numbers** — use thousands separators (1,240) and the · separator for metadata.
- **Code** — always JetBrains Mono, never shrink below Code/S (12px).

## 05 · Spacing, radius & elevation

All values live in the “Spacing & Radius” collection and the Elevation / Glow effect styles.

### Spacing — 4-point scale

Padding and gaps always come from this scale. Matches Tailwind’s default spacing (`p-4` = 16px).

| Token | Value | Typical use |
| --- | --- | --- |
| `space/1` | 4px | Icon ↔ text in chips |
| `space/2` | 8px | Inline gaps, list gaps |
| `space/3` | 12px | Row padding, button gaps |
| `space/4` | 16px | Card padding, grid gaps |
| `space/6` | 24px | Section gaps, page gutters inside panels |
| `space/8` | 32px | Panel window inset, modal padding |
| `space/12` | 48px | Toast inset from the viewport |
| `space/16` | 64px | Doc/page padding |

### Corner radius

| Token | Value | Use |
| --- | --- | --- |
| `radius/sm` | 4 | Badges, keycaps, tags, swatches |
| `radius/md` | 8 | Buttons, inputs, rows, code widgets |
| `radius/lg` | 12 | Cards, verdict boxes, threads |
| `radius/xl` | 16 | Panel window, modals, page panels |
| `radius/full` | 999 | Pills, avatars, status chips, dots |

### Elevation

Inside the panel window, separate surfaces with borders, not shadows. Shadows are only for things that float.

| Style | Value | Use |
| --- | --- | --- |
| Elevation/Card | 0 4 12 · #000 35% | Raised cards over the room (standup, stat tiles) |
| Elevation/Overlay | 0 16 48 · #000 55% | Modals, popovers, autocomplete, End of Day card |
| Glow/Accent | 0 0 24 · #FF8A3D 45% | Reward moments only: level-up, active hotspot |

## 06 · Layout & breakpoints

Desktop-first. Every screen is designed at 1440 × 900 and must work from 1280px wide. Below that, the game shows a dedicated screen instead of a squeezed layout.

### Anatomy of a panel screen

Figma shows this as a measured wireframe ([46:13](https://www.figma.com/design/VeKk5wTGNFUar5mVoXHyIb?node-id=46-13)). The regions:

- **App Bar** · 61px · logo · breadcrumb · streak · LV/XP · avatar
- **Tab bar** · 47px · Task Board · Codebase · Editor · VCS · Review · Back to room (Esc)
- **Sidebar** · 300px
- **Main area** · fills the rest (tabs, breadcrumb bar, content, status bar)
- **Toasts** · 48px inset

### Measurements

| Element | Size | Notes |
| --- | --- | --- |
| App Bar | Full width × 61px | On every desktop screen. Breadcrumb reads “Room / `<panel>`”. |
| Panel window | Inset 32px left/right/bottom, 80px from top · radius xl | One window for all tools; opens over the room. |
| Tab bar | 47px high | Active tab: accent underline. “Back to room” + Esc keycap on the right. |
| Sidebar | 300px fixed | File tree, ticket, source control, review summary. Footer actions pinned to the bottom. |
| Breadcrumb / file bar | ≈55px, padding 8 × 16 | Path in Code/S on the left, actions on the right. |
| Status bar | ≈32px | Editor only. Mode pill, language, encoding, cursor position. |
| Code line | 20px high · gutter 56px | Code/M; line numbers right-aligned, muted. |
| Standalone page (Profile) | Content 1376px, 32px margins, 24px gaps | Stat row of 4 equal tiles, then 3 columns (last column 520px). |
| Room hub | Standup card 352 · notification 380 · next-level 352 | Room art centred; shortcut bar bottom centre. |

### Breakpoints

Width decides the experience; there is no squeezed or mobile layout of the game itself.

| Viewport | Experience | Design reference |
| --- | --- | --- |
| ≥ 1280px wide | Full game | All screens (designed at 1440 × 900) |
| 1024–1279px, desktop | “Make the window a little wider” + Continue anyway | Screen 10b |
| < 1024px or touch device | “Best on a desktop” + email me a link | Screen 10a (390 × 844) |

### Layering (back to front)

1. **Room** — the isometric scene and its hotspots; always the bottom layer.
2. **Room UI** — standup card, notifications, next-level card, shortcut bar.
3. **Panel window** — the tool panels; or a scrim (`bg/base` at 62%) for full-screen moments like End of Day.
4. **Modal / popover** — confirmations, autocomplete (Elevation/Overlay).
5. **Toast** — bottom-right, above everything, one at a time.

## 07 · Components

All components live on the Design System page (Components frame). Use instances; never detach them on screens. Variants are named `Property=Value`.

### Rules

- **Instances only** — if a screen needs something a component cannot do, change the component (or add a variant), not the instance.
- **Token-bound** — every fill, stroke and radius in a component is bound to a variable; every text uses a text style.
- **Documented** — each component set has a description (visible in Dev Mode) and a row in this table.
- **One primary** — at most one Primary button per view; it is the next step.

### Inventory

| Component | Variants | Use & rules |
| --- | --- | --- |
| Button | Type: Primary · Secondary · Danger × State: Default · Hover · Focus · Disabled | Primary = the single next step (Start task, Commit & push, Fix in editor). Secondary = navigation/alternatives. Danger = destructive. Labels are verb phrases. |
| Input | State: Default · Focus · Error · Disabled | Label above, helper below (counts, errors). Commit message uses “Conventional commit · n / 72”. |
| Chip | Type: Unselected · Selected · Locked · Strength | Topics in onboarding/profile; Strength = earned skill with star. |
| Status Badge | Status: Assigned · In Progress · Submitted · Approved · Changes Requested | Ticket state everywhere. Always text + dot (see 03 · State mappings). |
| Difficulty | Level: Easy · Medium · Hard | Ticket difficulty next to the key. |
| Progress | Value: 25 · 50 · 75 · 100 | Label + meta + bar. Designs snap to the nearest variant; code renders the real %. |
| Tab | State: Active · Inactive · Hover | Panel window tabs only. |
| Editor Tab | State: Active · Inactive | Open files. Trailing slot: × to close, lock = read-only file. |
| Avatar | Kind: Player · Senior Dev | Player initials (P1) or the Senior Dev sparkle. |
| Panel | Elevation: Flat · Raised | Generic titled container for room UI. |
| Task Card | State: Default · Selected | Kanban ticket. Top row and footer wrap in narrow columns. |
| File Tree Row | Kind: Folder Open · Folder Closed · File × State: Default · Selected | Codebase tree and changed-files list (24px rows). |
| Diff Line | Type: Context · Added · Removed · Hunk | Old/new line numbers + sign + Code/M. Used in VCS and review threads. |
| Toast | Type: Loading · Success · Error · Info | Async status, bottom-right. Loading has an indeterminate bar. |
| Review Comment | Severity: Must fix · Suggestion · Praise | Senior Dev comment: author, file:line, severity tag, body. Anchored under code. |
| Criteria Item | State: Todo · Done | Acceptance criteria checklists (ticket, editor, review). |
| History Item | Verdict: Approved · Changes Requested | Review history timeline on Profile. |
| Selection Card | Type: Default · Selected · Selected Locked · Coming Soon | Onboarding choices (language, framework, level). |
| Stepper Step | State: Done · Current · Upcoming | Onboarding progress (3 steps). |
| Room Hotspot | State: Default · Hover · Focus | Clickable room objects with a shortcut keycap (T, P). |
| Stat Tile | Tone: Accent · Neutral | Profile stats. Only one Accent tile per row (XP). |
| Modal | — | Confirmations before consequential actions (“Push to review?”). Never for navigation. |
| Level Up Callout | — | Reward moment when a focus area improves. Uses Glow/Accent. |
| App Bar | Breadcrumb (text property) | Top of every desktop screen. |

### Icons

22 icons, 16px, 1.5px stroke, named `icon/<name>`. Recolour by binding the vector stroke to a token; never redraw an icon on a screen.

`java` · `xml` · `config` · `markdown` · `folder` · `folder-open` · `chevron-right` · `chevron-down` · `check` · `lock` · `sparkle` · `commit` · `branch` · `flame` · `star` · `x` · `alert` · `clock` · `arrow-left` · `comment` · `board` · `user`

> **Adding a component:** 1) Build it on the Design System page with token-bound fills, text styles and `Property=Value` variants. 2) Write its description. 3) Add a row to this inventory. 4) Add it to the Trello “Build UI primitives” card so code follows.

## 08 · Patterns

Recurring solutions. Reuse them before inventing a new one; if a new pattern is needed, add it here.

### Panel window & tabs

See screens 3–7.

- **Over the room** — tools open in one panel window on top of the room; the room stays the hub.
- **Tabs keep state** — switching Task Board → Codebase → Editor → VCS → Review never loses work.
- **Always a way back** — “Back to room” with an Esc keycap, top-right of the tab bar.
- **One URL per tab** — `/room/task`, `/room/codebase`, `/room/editor`, `/room/vcs`, `/room/review`.

### Code surfaces

See screens 4, 5.

- **Type** — Code/M, 20px lines, 56px gutter with right-aligned muted line numbers.
- **Syntax** — use the token mapping in 03 · Color; never invent colours.
- **Read-only** — lock icon on the editor tab + a “Viewing only — no edits here” pill (Codebase Explorer).
- **Editing** — active line on `bg/elevated`, accent cursor, 3px success bar in the gutter for changed lines, Monaco-style autocomplete with Elevation/Overlay.
- **Status bar** — mode pill (EDITING), language, encoding, TODO count, criteria count, cursor position.

### Diffs

See screens 6a, 6b.

- **Unified by default** — with a Unified / Split toggle in the file header.
- **File header** — language icon, full path in Code/S, +added (success) −removed (danger), then actions.
- **Rows** — Diff Line component: Hunk rows on `info/subtle`, Added with “+” on a success tint, Removed with “−” on a danger tint.

### Review loop

The core of the game — give it the most care. See screens 7a, 7b.

- **Verdict first** — a tinted verdict card (status badge, H2, one-line summary) at the top of the sidebar.
- **Attempt counter** — three dots: past attempts muted, current attempt in the verdict colour, future attempts outlined.
- **Criteria** — the ticket’s acceptance criteria, ticked by the review result.
- **Threads anchored to code** — file:line header, 2–3 lines of diff context, then the Review Comment indented 88px under the code.
- **Severity order** — Must fix > Suggestion > Praise. Every review should contain at least one Praise if anything was done well.
- **Next step** — Changes requested → “Fix in editor” (resubmitting starts the next attempt). Approved → “Ship it & end the day”.

### Rewards & progress

See screens 2, 7b, 8, 9.

- **XP is itemised** — show the breakdown (ticket, first-try bonus, streak bonus). A missed bonus shows as +0 with the reason, never hidden.
- **Level progress** — Progress component labelled “Level n → n+1” with “current / next XP · x to go”.
- **Level-ups** — Level Up Callout with Glow/Accent; the only place glow is used besides the active room hotspot.
- **Streak** — flame icon + “n-day streak”; week view uses dots (done = `accent/subtle`, today = accent, upcoming = outlined).

### Toasts

| Type | When | Example |
| --- | --- | --- |
| Loading | Async work in progress (AI review takes ~20–40s) | AI Senior Dev is reviewing… · Reviewing UserController.java |
| Success | An action finished that the user is not watching | Review ready — open the Review tab |
| Error | Something failed; pair with an inline state if the screen depends on it | Review couldn’t start · The AI service didn’t respond |
| Info | New information, nothing to do yet | New task on your board · CT-104 |

- **Placement** — bottom-right, 48px from the viewport edges, above everything.
- **One at a time** — a new toast replaces the old one; errors stay until dismissed or resolved.

### Empty & error states

One pattern, three tones. Build it once in code and reuse it. See screens 11a, 11b, 11c.

| Part | Spec |
| --- | --- |
| Icon badge | 72px circle, `tone/subtle` background, 32px icon in `tone/default` |
| Kicker | Overline in `tone/default` (e.g. REVIEW DELAYED) |
| Title | Heading/H2, `text/primary` — says what happened in plain words |
| Body | Body/L, `text/muted`, max 3 lines — is my work safe, and what happens next |
| Status chip (optional) | Clock icon + countdown or retry info |
| Actions | Secondary (way out) + Primary (fix/continue) |
| Reference (optional) | Code/S, `text/muted` — error ref for support |
| Width | 480px, centred in the available area |

| Tone | Meaning | Example |
| --- | --- | --- |
| success | Nothing to do — all good | 11a All caught up |
| warning | Temporary, recovers on its own; the player loses nothing | 11b The Senior Dev is offline (retrying in 28s) |
| danger | Unexpected error on our side | 11c Something broke on our side |

### Confirmations & loading

- **Modal only for consequential actions** — e.g. “Push to review?”. Never to confirm navigation.
- **Disabled after commit** — once pushed, the commit box and button go Disabled with an explanatory label (“Pushed · waiting for review”).
- **Loading** — short waits use muted inline text (“Loading today’s task…”); long AI waits use a Loading toast. Skeletons are an open question (13).

## 09 · Screens & flow

Every route and state has a frame on the Screens page. Section N holds frames Na, Nb… for its states.

### Core loop

One in-game workday (15–30 minutes). Frame numbers are in brackets.

Login (1a) → Onboarding (1b–1d · first login) → Room (2) → Task Board (3) → Codebase (4) → Editor (5) → VCS · push (6a → 6b) → Review (7a / 7b) → End of Day (9)

> **Changes requested loops back:** Review (7a) → “Fix in editor” → Editor (5) → VCS push (6) → Review again. Each push is a new attempt; only an approval ends the day.

### Screen inventory

| Screen (section) | Frames | Route | Notes |
| --- | --- | --- | --- |
| 1 Login / Onboarding | 1a–1d | `/login` · `/onboarding` | 3 steps: stack, level, topics (topics loaded from `GET /api/topics`) |
| 2 Main Room | 2 | `/room` | Hub. Daily standup card, hotspots (T, P), next-level card, shortcut bar |
| 3 Task Board | 3 | `/room/task` | Kanban + ticket detail; “Start task” is the primary action |
| 4 Codebase Explorer | 4 | `/room/codebase` | Read-only file tree + viewer, senior-dev tip |
| 5 Monaco Editor | 5 | `/room/editor` | Ticket & criteria sidebar, editor, status bar |
| 6 VCS Panel | 6a, 6b | `/room/vcs` | Commit & push → pushed + AI reviewing toast |
| 7 Review Panel | 7a, 7b | `/room/review` | Changes requested / Approved |
| 8 Profile / Progress | 8 | `/profile` | Standalone page (not a panel tab) |
| 9 End of Day | 9 | `/room/end-of-day` | Shown after an approval; scrim over the room |
| 10 Best on desktop | 10a, 10b | Any route, by viewport | Phone/touch and narrow desktop window |
| 11 Empty & error states | 11a–11c | Contextual | No ticket today · AI offline · app error boundary |

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| T | Open the Task Board |
| P | Open Profile |
| Esc | Close the panel / back to the room |
| Ctrl/⌘ + Enter | Commit & push (VCS) — proposed, not designed yet |

## 10 · Accessibility

Target: WCAG 2.1 AA for everything outside the room art.

- **Contrast** — body text ≥ 4.5:1, large text and UI parts ≥ 3:1. Use the verified pairs in 03 · Color · Contrast. Never put `text/primary` on a solid accent.
- **Focus** — every interactive element shows a 2px `info/default` ring with 2px offset, keyboard only (`:focus-visible`). Never remove focus without a replacement.
- **Not colour alone** — status uses text + dot, diffs use + / −, comments use a severity label, criteria use a check icon.
- **Keyboard** — everything reachable by Tab in reading order; T / P / Esc shortcuts; panels behave as dialogs (`role="dialog"`, focus trapped, Esc closes).
- **Targets** — buttons and rows at least 32px high; dense IDE rows (file tree) 24px are allowed inside the tools.
- **Motion** — glows, the indeterminate progress bar and celebration animations respect `prefers-reduced-motion`.
- **Code** — the Monaco container has an `aria-label`; read-only state is announced, not only shown with a lock.
- **Language** — errors explain what happened, whether work is safe and what to do next (see 02 · Writing rules).

## 11 · Handoff & naming

Figma variables map 1:1 to Tailwind v4 theme variables in `frontend/src/styles/tokens.css`. Use Dev Mode to inspect; never copy raw values.

### Token mapping

Rule: replace “/” with “-”, prefix with the Tailwind namespace, drop “/default”.

| Figma | tokens.css (`@theme`) | Tailwind class |
| --- | --- | --- |
| `bg/base` | `--color-bg-base` | `bg-bg-base` |
| `bg/surface` | `--color-bg-surface` | `bg-bg-surface` |
| `border/default` | `--color-border` | `border-border` |
| `border/strong` | `--color-border-strong` | `border-border-strong` |
| `border/input` | `--color-border-input` | `border-border-input` |
| `accent/default` | `--color-accent` | `bg-accent` `text-accent` |
| `accent/on-subtle` | `--color-accent-on-subtle` | `text-accent-on-subtle` |
| `accent/ink` | `--color-accent-ink` | `text-accent-ink` |
| `success/subtle` | `--color-success-subtle` | `bg-success-subtle` |
| `text/muted` | `--color-text-muted` | `text-text-muted` |
| `radius/md` | `--radius-md: 8px` | `rounded-md` |
| `space/4` | Tailwind default scale (4px base) | `p-4` `gap-4` |
| Display/\* (Pixelify Sans) | `--font-display` | `font-display` |
| Heading, Body, Label (Space Grotesk) | `--font-sans` | `font-sans` |
| Code/\* (JetBrains Mono) | `--font-mono` | `font-mono` |
| Elevation/Overlay | `--shadow-overlay` | `shadow-overlay` |

### Naming conventions

| Thing | Convention | Example |
| --- | --- | --- |
| Screen section | N Screen name | 7 Review Panel |
| State frame | `N<letter>` Area · State | 7a Review · Changes requested |
| Component set | PascalCase noun | Review Comment |
| Variant | `Property=Value`, Title Case | `Severity=Must fix` |
| Component property | Plain label | Label, Code, File |
| Icon | `icon/kebab-case` | `icon/chevron-right` |
| Variable | `group/role` | `accent/on-subtle` |
| Text style | `Category/Size` | Heading/H2 |
| Layer | Role, not appearance | Actions, Sidebar, Spacer — not “Frame 12” |

### Component → code

Planned React components (`frontend/src/components`). One Figma component set = one React component; variants = props.

| Figma | React |
| --- | --- |
| Button (Type, State) | `<Button variant="primary\|secondary\|danger" disabled />` |
| Status Badge (Status) | `<StatusBadge status="APPROVED" />` |
| Review Comment (Severity) | `<ReviewComment severity="must-fix" file line />` |
| Diff Line (Type) | `<DiffLine type="added" oldNo newNo code />` |
| Toast (Type) | `<Toast type="loading\|success\|error\|info" />` |
| Empty state pattern (tone) | `<EmptyState tone="success\|warning\|danger" icon title body actions />` |

### Known gaps between design and code (2026-11-06)

Tracked as cards in the TODO list on the Trello board.

> This table is copied as it stands in Figma, and [this Trello card](https://trello.com/c/otnwbry7) already lists it as stale. Some gaps may be closed and some card names have changed, so check the board for the current state.

| Gap | Trello card |
| --- | --- |
| `tokens.css` still has placeholder purple/gray values and wrong font variable names | [Design] Apply Night Shift values to tokens.css |
| Design fonts are not loaded in the app | [Design] Load design fonts |
| Text on solid accent uses `text-primary`; focus ring uses accent instead of info | [Design] Docs still say “branding not defined” + focus/contrast |
| Panels are full pages, not overlays; no VCS route | [Design] Panels are full pages, not overlays |
| Only 4 of 24 components exist in code | [Design] Build UI primitives matching the Figma component sets |
| No error boundary / AI-offline handling | [Resilience] Harden API layer |

## 12 · Decisions

Newest last. Add a row whenever a decision changes the look, flow or rules — with the reason.

| Date | Decision | Why | Status |
| --- | --- | --- | --- |
| 2026-11-01 | Night Shift brand direction | The evening-shift fantasy; warm lamp + monitor glow give strong contrast for code | Accepted |
| 2026-11-01 | Three fonts with strict roles | A pixel face gives game identity but is unreadable at length | Accepted |
| 2026-11-01 | Dark theme only for the MVP | Fits the night room; one theme to build and test | Accepted |
| 2026-11-01 | Primitive + semantic variable layers | Rebrand by re-pointing semantics; components never change | Accepted |
| 2026-11-01 | Desktop-first, minimum 1280px | Editor, diff and review need to sit side by side | Accepted |
| 2026-11-01 | Static isometric room as placeholder art | MVP scope (north_star): loop first, polish later | Accepted |
| 2026-11-06 | All tools share one tabbed panel window over the room | Keeps the room as hub; maps to nested routes `/room/<tab>` | Accepted · code pending |
| 2026-11-06 | Profile is a standalone page | Dashboard density; deep-linkable `/profile` | Accepted |
| 2026-11-06 | Review threads: 2–3 lines of context + indented comment | Familiar from real pull-request reviews | Accepted |
| 2026-11-06 | Penalties are shown, not hidden (+0 first-try bonus) | Honesty; motivates first-try quality | Accepted |
| 2026-11-06 | Our failures never cost an attempt (AI offline) | Fairness — principle 6 | Accepted · code pending |
| 2026-11-06 | One empty/error pattern with three tones | Consistency; one component in code | Accepted · code pending |
| 2026-11-06 | Task Card wraps instead of clipping | Badges stay readable in narrow Kanban columns | Accepted |
| 2026-11-06 | Text on solid accent uses `accent/ink` | `text/primary` on accent is ~2:1 contrast | Accepted · code pending |
| 2026-11-06 | This page is the design spec | One place for conventions, rules and decisions, next to the designs | Accepted |
| 2026-11-08 | Input default border uses `border/input` | `border/strong` is only 1.8:1. The new token reaches 3.4:1 on the surface and 3.1:1 on the input fill. Disabled inputs keep `border/default`, as WCAG exempts them | Accepted · code pending |

## 13 · Open questions

Not decided yet. Do not design around these silently — raise them first.

| Question | Context |
| --- | --- |
| Skill Profile granularity | Coarse, player-facing tags vs fine-grained AI context (north_star decision #8). Affects Profile and End of Day. |
| Final room art & avatar | Current room is placeholder vector art; pixel art and avatar customisation are post-MVP. |
| Loading: skeletons or text? | Today: muted “Loading…” text and a Loading toast for AI waits. |
| Minimum viewport height | Designed at 900px high; behaviour below ~800px not defined. |
| Light or high-contrast theme | Dark only for the MVP; the variable structure allows another mode later. |
| Motion and sound for rewards | No motion spec yet for level-ups, XP count-up or streaks. |
| Onboarding inline errors | What the topics step shows if `GET /api/topics` fails. |
| Localisation | Copy is English-only; layouts assume English text lengths. |
