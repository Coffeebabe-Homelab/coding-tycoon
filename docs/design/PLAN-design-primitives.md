# PLAN — Design Stage 2: Primitives

Roadmap: [PLAN-design-implementation.md](PLAN-design-implementation.md)

## Goal
Build the six primitives that have a use today or in Phase 4, replace the copied class strings, and test them.

**Card:** [primitives](https://trello.com/c/Bu7ggkjA)
**Needs:** Stage 1 merged. Decisions D4, D9, D10. Vitest and React Testing Library are already on `dev` (PR #26).

## Constraints
- Prop names follow Design Spec › 11 (48:295). One Figma set = one React component; variants = props.
- Only add a variant when something uses it. Exceptions: Button's three variants are set in the handoff table, and StatusBadge's five match the `TaskStatus` type.
- Components stay presentational, as CONVENTIONS requires: no fetching, no business logic.
- Follow the existing test layout: test files sit next to the code they cover (`useTask.test.ts`).
- Red → green: write the test first, one primitive per commit, each under 100 lines where possible. If a migration pushes a commit over, split it.

## Steps

### 1. `Button` (Figma 8:31)
- [ ] `<Button variant="primary|secondary|danger" disabled />`, defaulting to `type="button"`.

| Variant | Default | Hover | Text |
|---------|---------|-------|------|
| primary | `bg-accent` | `bg-accent-hover` | `accent-ink` |
| secondary | `bg-bg-elevated`, `border` | `border-strong` | `text-primary` |
| danger | `bg-danger-subtle`, `danger` border | `bg-danger`, text `accent-ink` | `danger` |

- All: `rounded-md`, `px-4 py-2`, `label-m`. Disabled: 40% opacity, `cursor-not-allowed`.
- `EndOfDayPage` has a `Link` styled as a primary button, so export `buttonClasses(variant)` for it. A `Link` shouldn't become a `<button>`.
- [ ] Migrate the 7 primary uses, then the 3 secondary copies (`OnboardingWizard`, `ProfilePage`, `EndOfDayPage`) and the disabled `TaskBoardPage` "Continue" button.
- [ ] Tests: renders its label; click fires; disabled doesn't fire; default `type`; passes through `aria-*`.

### 2. `Icon` (Figma 7:217)
- [ ] `<Icon name="check" />`: 16px, 1.5px stroke, `currentColor`, `aria-hidden` by default.
- [ ] Export only what's used now or by Stage 3 and Phase 4: `x`, `check`, `lock`, `arrow-left`, `branch`, `commit`, `flame`, `user`. Others are added on first use.
- [ ] Replace the `Overlay` × glyph, keeping its `aria-label`.
- [ ] Tests: renders each name; hidden from screen readers by default.

### 3. `Difficulty` (Figma 8:106)
- [ ] `<Difficulty level={...} />`: `rounded-sm`, `px-2 py-1`, `label-s`; Easy success, Medium warning, Hard danger, each on its `*-subtle`.
- [ ] `task.difficulty` is a plain string from the API, so match case-insensitively and use a neutral style for unknown values, as `difficultyClasses()` does.
- [ ] Replace `difficultyClasses()` in `TaskBoardPage`.
- [ ] Tests: each level; mixed case; unknown value.

### 4. `StatusBadge` (Figma 8:96)
- [ ] `<StatusBadge status="APPROVED" />`, typed with `TaskStatus`. Pill, 6px dot, `overline` label: Assigned info, In Progress warning, Submitted accent (`accent-subtle` + `accent-on-subtle`), Approved success, Changes Requested danger. Always text and dot, never colour alone.
- [ ] Use it in the `TaskBoardPage` header, matching Figma 14:182.
- [ ] Tests: the label for all five statuses.

### 5. `Chip` (Figma 8:77)
- [ ] Replaces `TopicChip`. Unselected and Selected only (Selected has the `check` icon and accent border). Locked and Strength wait for their screens.
- [ ] Renders a `<button aria-pressed>` when it has `onClick`, otherwise a plain element for read-only tags.
- [ ] Replace the 2 inline tag strings in `TaskBoardPage` and `ProfilePage`.
- [ ] Tests: `aria-pressed` follows `selected`; click toggles; read-only renders no button.

### 6. `Input` (Figma 8:55)
- [ ] `<Input label helper error disabled multiline />`: label above (`label-s`, muted), helper or error below, `bg-bg-elevated`, `rounded-md`, `px-3 py-2`, `body-m`. Border per D4; error border `danger`.
- [ ] `multiline` renders a `<textarea>`, because the commit message in 6a is two lines.
- [ ] Label linked to the field; error sets `aria-invalid` and `aria-describedby`.
- [ ] No current call site: Phase 4 is the first user, so check the API against 32:478 first.
- [ ] Tests: label association; typing fires `onChange`; error wiring; disabled; `multiline`.

### 7. Docs
- [ ] `frontend/SPEC.md`: primitives table and pattern table. `CHANGELOG.md`.
- [ ] Update CONVENTIONS' Button example.

## Files affected
New in `frontend/src/components/`: `Button.tsx`, `Icon.tsx`, `Difficulty.tsx`, `StatusBadge.tsx`, `Chip.tsx`, `Input.tsx`, plus their tests. Removed: `TopicChip.tsx`.
Changed: `frontend/src/components/{Overlay,OnboardingWizard}.tsx`, `frontend/src/pages/{EndOfDayPage,LoginPage,ProfilePage,TaskBoardPage}.tsx`, `frontend/SPEC.md`, `CONVENTIONS.md`, `CHANGELOG.md`.

## Verification
- `npm test`, `npm run lint`, `npm run build` pass. Coverage on the new components meets the 80% target, all branches included.
- Search finds no `bg-accent` outside `Button`, and no `difficultyClasses`.
- Visual check of each variant against the Figma component frames, using the real pages. No Storybook.
- Keyboard: Tab, Enter and Space work on Button and Chip; focus ring shows.
- Existing flows still work: log in, onboarding, start a task, edit profile, end of day.

## Risks
- `Input` has no user until Phase 4, so its API may need a tweak then. Keep it small.
- `Chip` as both toggle and read-only is the one dual-purpose component. If it gets awkward, split it.

## Done when
1. All six primitives exist, tested and used by every matching call site.
2. No copied primary or secondary button class strings remain.
3. SPEC lists the primitives.
4. Card [primitives](https://trello.com/c/Bu7ggkjA) is moved per the AGENTS.md workflow. It stays open, or gets split, for the remaining Figma components.
