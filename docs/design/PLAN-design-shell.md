# PLAN — Design Stage 3: Game shell

Roadmap: [PLAN-design-implementation.md](PLAN-design-implementation.md)

## Goal
Replace `RoomHud` and the tool `Overlay` chrome with Figma's App Bar and tabbed panel window, and move Profile to a standalone page, so Phase 4 adds panels to the final container.

**Card:** [routes](https://trello.com/c/LXw2xTF7). The shell itself has no dedicated card, so this needs a comment there or a new card when it starts.
**Needs:** Stage 2 merged. Decisions D5, D6, D7.
**Figma:** App Bar 9:316, Tab 8:144, anatomy 46:9, measurements 46:25, pattern 47:260, decisions 48:573.

## Constraints
- Keep today's behaviour: the panel route lives in the URL, Back closes it, focus is trapped, Esc closes, focus returns to the opener, the room is `inert`.
- No global store. Panels stay nested routes, as SPEC says.
- Don't build Editor, VCS or Review, or redesign panel content.

## Steps

### 1. `AppBar` (replaces `RoomHud`)
- [ ] 61px high, `bg-bg-surface`, bottom border. Logo in `font-display`, breadcrumb "Room / <panel>", streak pill with `flame`, XP pill, avatar.
- [ ] Keep the "wrap up the day" link after an approval.
- [ ] Apply D7 for level and Log out.
- [ ] Tests: breadcrumb per route; hides stats when `progress` is null (as `RoomHud` does); wrap-up link appears only after an approval; Log out reachable.

### 2. `PanelWindow` (tool panels)
- [ ] Inset 32px left, right and bottom, 80px from the top, `rounded-xl`, one fixed size (46:25).
- [ ] Tab bar, 47px high: `nav` of links with `aria-current="page"`, active tab with accent underline. The tabs change the URL, so they're links, not ARIA `role="tab"`.
- [ ] "Back to room" with `arrow-left` and an `Esc` keycap on the right.
- [ ] Reuse `Overlay`'s dialog logic: `role="dialog"`, `lib/focusTrap`, Esc, focus restore. Extract it into a small hook so it isn't duplicated.
- [ ] Tab list from one array; apply D6 for panels without a route.
- [ ] Migrate `TaskBoardPage` and `CodebaseExplorerPage`. Remove `Overlay`'s `wide` prop once nothing uses it.
- [ ] Keep `?file=` when going to Codebase and back, so the open file isn't lost ("tabs keep state").
- [ ] `EndOfDayPage` keeps `Overlay` with a scrim, per Figma: it isn't a tab.
- [ ] Tests: active tab has `aria-current`; link targets; Esc and Back navigate to `/room`; focus trap and restore; `?file=` kept.

### 3. Standalone Profile
- [ ] Route `/profile` under `ProtectedRoute`, rendering `AppBar` and the existing profile content in a page layout. Content itself stays as is; Screen 8's content comes with Phase 6.
- [ ] `/room/profile` redirects to `/profile`. Update `RoomHud`/`AppBar` links.
- [ ] Tests: `/profile` renders; `/room/profile` redirects; unauthenticated access stays protected.

### 4. Docs
- [ ] `frontend/SPEC.md`: routing table, adding `/room/vcs` as Phase 4's URL (no route code yet); shell component table; note that `Overlay` is now for full-screen moments only. `CHANGELOG.md`.

## Files affected
New: `frontend/src/components/{AppBar,PanelWindow}.tsx`, a small dialog hook in `frontend/src/hooks/`, tests.
Changed: `frontend/src/App.tsx`, `frontend/src/components/Overlay.tsx`, `frontend/src/pages/{GameRoomPage,TaskBoardPage,CodebaseExplorerPage,ProfilePage,EndOfDayPage}.tsx`, `frontend/SPEC.md`, `CHANGELOG.md`.
Removed: `frontend/src/game/RoomHud.tsx`.

## Verification
- `npm test`, `npm run lint`, `npm run build` pass.
- Compare with Figma 14:182 and 15:241 at 1440×900 for the chrome only, and check 1280 wide.
- Manual walk: open each panel from the room hotspot, switch tabs, refresh on each URL, use browser Back, Esc, and keyboard-only Tab through the window.
- Deep links `/room/task`, `/room/codebase?file=…` and `/profile` work after login. Coordinate with the ProtectedRoute bug card if deep-link refresh still fails there; that fix isn't part of this stage.

## Risks
- `useSessionFlow` opens the Task Board once per session and refers to room paths, so recheck it after the Profile move.
- `useProgress` refetches when a panel opens or closes. The standalone Profile needs its own fetch for the App Bar.
- "Tabs keep state" isn't fully solved here: switching tabs unmounts the panel. That's fine for today's panels, but Phase 4 has to keep editor drafts outside the route.

## Done when
1. All tool panels use one `PanelWindow` with working tabs and one URL per tab.
2. `AppBar` shows on the room, panels and Profile.
3. `/profile` is standalone.
4. Dialog behaviour from Phase 7 still passes its tests.
5. SPEC's routing matches `App.tsx` and names `/room/vcs`.
