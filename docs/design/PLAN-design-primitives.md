# PLAN — Design Stage 2: Primitives

Roadmap: [PLAN-design-implementation.md](PLAN-design-implementation.md)

## Goal
Build the four primitives that have a use today, replace the copied class strings, and test them. Only `Button` and `Icon` must be merged before Phase 4. `Difficulty` and `StatusBadge` must exist by the time Phase 4 builds Screen 5. Build `Button` and `Icon` first.

`Chip` moved to [Stage 4](PLAN-design-screens.md), its first user. `Input` waits for Phase 4 (see the end of this plan). Other Figma components follow D9's first-use rule.

**Card:** [primitives](https://trello.com/c/Bu7ggkjA)
**Needs:** Stage 1 merged. Vitest and React Testing Library are already on `dev` (PR #26).

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
- [ ] Migrate every match of the solid accent search in the [foundation plan](PLAN-design-foundation.md#searches), including `CallbackPage`'s "Try again". Then migrate the secondary copies (`OnboardingWizard`, `ProfilePage`, `EndOfDayPage`, `CallbackPage`'s "Log out") and the disabled `TaskBoardPage` "Continue" button.
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
- [ ] `<StatusBadge status="APPROVED" />`, typed with `TaskStatus`. Pill, 6px dot, `label-s` label (Design Spec § 04 assigns Label/S to badges): Assigned info, In Progress warning, Submitted accent (`accent-subtle` + `accent-on-subtle`), Approved success, Changes Requested danger. Always text and dot, never colour alone.
- [ ] Use it in the `TaskBoardPage` header, matching Figma 14:182.
- [ ] Tests: the label for all five statuses.

### 5. Docs
- [ ] `frontend/SPEC.md`: primitives table and pattern table. `CHANGELOG.md`.
- [ ] Update CONVENTIONS' Button example.

## Files affected
New in `frontend/src/components/`: `Button.tsx`, `Icon.tsx`, `Difficulty.tsx`, `StatusBadge.tsx`, plus their tests.
Changed: `frontend/src/components/{Overlay,OnboardingWizard}.tsx`, `frontend/src/pages/{CallbackPage,EndOfDayPage,LoginPage,ProfilePage,TaskBoardPage}.tsx`, `frontend/SPEC.md`, `CONVENTIONS.md`, `CHANGELOG.md`.

## Verification
- `npm test`, `npm run test:coverage`, `npm run lint`, `npm run build` pass. Coverage on the new components meets the 80% target, all branches included.
- The solid accent search finds nothing outside `Button`. No `difficultyClasses` remains.
- Visual check of each variant against the Figma component frames, using the real pages. No Storybook.
- Keyboard: Tab, Enter and Space work on Button; focus ring shows.
- Existing flows still work: log in, the login error screen, onboarding, start a task, edit profile, end of day.

## Done when
1. All four primitives exist, tested and used by every matching call site.
2. No copied primary or secondary button class strings remain.
3. `frontend/SPEC.md` lists the primitives.
4. Card [primitives](https://trello.com/c/Bu7ggkjA) is moved per the `AGENTS.md` workflow. It stays open, or gets split, for the remaining Figma components.

## Deferred to Phase 4: `Input` (Figma 8:55)
Kept here so Phase 4 can pick it up.
- [ ] `<Input label helper error disabled multiline />`: label above (`label-s`, muted), helper or error below, `bg-bg-elevated`, `rounded-md`, `px-3 py-2`, `body-m`. Border `border-input` (D4), error border `danger`, disabled border `border`.
- [ ] `multiline` renders a `<textarea>`, because the commit message in 6a is two lines.
- [ ] Label linked to the field; error sets `aria-invalid` and `aria-describedby`.
- [ ] Check the API against 32:478 first.
- [ ] Tests: label association; typing fires `onChange`; error wiring; disabled; `multiline`.
