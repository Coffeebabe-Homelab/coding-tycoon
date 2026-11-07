# PLAN — Design Stage 4: Login and onboarding

Roadmap: [PLAN-design-implementation.md](PLAN-design-implementation.md)

## Goal
Bring Login and the onboarding wizard in line with Figma section 1. These are the only screens the current cards ask to compare; other screens need their own cards.

**Card:** [routes](https://trello.com/c/LXw2xTF7)
**Needs:** Stage 2 merged, decision D8. Independent of Stage 3: these screens have no App Bar.
**Figma:** section 11:2. Frames 1a Login 11:3, 1b Stack 11:25, 1c Level 11:78, 1d Topics 11:139. Components Selection Card 10:127, Stepper Step 10:145.

## Constraints
- No change to the auth flow, `useCreateProfile`, `useTopics` or the profile API.
- Keep the wizard's validation: at least one topic to finish.
- Copy follows Design Spec › 02: sentence case, specific, names the next step.

## Steps

### 1. Login (1a)
- [ ] Split layout: left panel on `bg-bg-surface` with logo (`font-display`, `text-accent`), headline, tagline, one primary `Button` ("Log in"), and the Auth0 note. Right side on `bg-bg-base` with the art and "Your desk is waiting."
- [ ] Add the art per D8. If exported from Figma, store it locally and use `alt=""`; never reference a temporary Figma URL.
- [ ] Tests: the button calls `loginWithRedirect`; title and button are accessible.

### 2. `StepperStep` (10:145)
- [ ] `<StepperStep state="done|current|upcoming" label />`, with the `check` icon for done. Mark the current one with `aria-current="step"`, so state isn't shown by colour alone.
- [ ] Tests: each state; `aria-current`.

### 3. `SelectionCard` variants (10:127)
- [ ] Align with Figma: Default, Selected, Selected Locked, Coming Soon. Prop names follow the Figma variants.
- [ ] Add the `caption` line. Coming Soon is disabled; Selected Locked can't be changed and shows `lock`. Figma uses Selected Locked for Java and Spring Boot, the only MVP options.
- [ ] Tests: click on Default fires; Coming Soon and Selected Locked don't; selected state is exposed to screen readers.

### 4. Wizard layout (1b–1d)
- [ ] Use `StepperStep`, `text-overline` section labels, `Chip`, and `Button` for Back and Next/Finish. "One primary" per view.
- [ ] Layout, spacing and copy from the three frames.
- [ ] Topics load failure: Figma lists this as an open question (13). Keep today's inline error text unless you decide otherwise.
- [ ] Tests: step navigation; Back disabled on step 1; Finish disabled with no topic; saving state; save error shown.

### 5. Docs
- [ ] `frontend/SPEC.md` if component structure changes. `CHANGELOG.md`.

## Files affected
New: `frontend/src/components/StepperStep.tsx`, the login art asset, tests.
Changed: `frontend/src/pages/{LoginPage,OnboardingPage}.tsx`, `frontend/src/components/{OnboardingWizard,SelectionCard}.tsx`, `frontend/SPEC.md`, `CHANGELOG.md`.

## Verification
- `npm test`, `npm run lint`, `npm run build` pass.
- Side-by-side with frames 11:3, 11:25, 11:78 and 11:139 at 1440×900, then check 1280 wide.
- Real flow on a new account: log in → three steps → room. Profile data saved as before. Keyboard-only run through the wizard.

## Risks
- A real first-login test needs a fresh Auth0 user. Plan for this on staging or use a mocked hook test plus one manual run.
- `SelectionCard` is also used by `ProfilePage`, so recheck profile editing after the variant change.

## Done when
1. Login and all three wizard steps match their Figma frames at 1440×900 and work at 1280.
2. New tests cover the wizard's branches.
3. Onboarding still creates a profile end to end.
4. Card [routes](https://trello.com/c/LXw2xTF7) is updated. It closes only if the VCS route item is resolved by Phase 4 or moved.
