# PLAN — Design Stage 3: Game shell

Roadmap: [PLAN-design-implementation.md](PLAN-design-implementation.md)

## Goal
Part A replaces the tool `Overlay` chrome with Figma's tabbed panel window, so Phase 4 adds panels to the final container. Part B replaces `RoomHud` with the App Bar and moves Profile to a standalone page. Part B ships separately and doesn't block Phase 4.

**Figma:** App Bar 9:316, Tab 8:144, anatomy 46:9, measurements 46:25, pattern 47:260. Design Spec § 06, § 08 and § 12 · Decisions in [`DESIGN_SPEC.md`](DESIGN_SPEC.md).

## Target routes

```
/room                     GameRoomPage: room + RoomHud + <Outlet/>
└─ (no path)              PanelWindow: stays mounted for all of /room
   ├─ (index)             nothing shown; visited tabs stay hidden
   ├─ task                TaskBoardPage (tab)
   ├─ codebase            CodebaseExplorerPage (tab)
   ├─ profile             ProfilePage in Overlay, until part B
   └─ end-of-day          EndOfDayPage in Overlay
```

Phase 4 adds `editor` and `vcs` as tabs, and a later phase adds `review`. `PanelWindow` keeps each visited tab's page and renders it inside `<Activity>`: `visible` for the current tab, `hidden` for the rest.

---

# Part A: Tabbed panel window (needed before Phase 4)

**Card:** tracked on [card 37](https://trello.com/c/otnwbry7). Split it into its own card when this starts.
**Needs:** `Button` and `Icon` merged.

## Constraints
- Keep today's behaviour: the panel route lives in the URL, Back closes it, focus is trapped, Esc closes, focus returns to the opener, and the room and top bar are `inert` while a panel is open.
- `RoomHud` stays above the window until part B (owner decision, 2026-11-08). The top bar stays inert while a panel is open, as the Design Spec requires a dialog with focus trapped (§ 10).
- No global store. Panels stay nested routes, as `frontend/SPEC.md` says.
- Don't build Editor, VCS or Review, or redesign panel content.

## Steps

### 1. Prove that tabs stay alive
- [ ] Red first: add tests that switch tabs and close and reopen the panel, and assert that expanded folders in `FileTree` are kept.
- [ ] Add `PanelWindow` as a pathless layout route under `/room`, as in Target routes, keeping visited tabs in `<Activity>`. The window's dialog label comes from the tab array.
- [ ] `GameRoomPage` can no longer tell a panel is open from `useOutlet()`, because the layout route always matches. Base the `inert` state on the current path.
- [ ] In a real browser, check scroll position in the file tree and in Monaco, and that Monaco still works after being hidden and shown. Tests can't show this.
- [ ] If the window itself doesn't stay mounted, stop and revisit the design. If only one kind of state is lost, save it by hand in `PanelWindow`: for example, Monaco's `saveViewState` and `restoreViewState`.

### 2. `PanelWindow` chrome
- [ ] Inset 32px left, right and bottom, 80px from the top, `rounded-xl`, one fixed size (46:25).
- [ ] Tab bar, 47px high: `nav` of links with `aria-current="page"`, active tab with accent underline. The tabs change the URL, so they're links, not ARIA `role="tab"`.
- [ ] Tab links use `replace`, so Back closes the panel instead of walking back through tabs.
- [ ] "Back to room" with `arrow-left` and an `Esc` keycap on the right.
- [ ] Reuse `Overlay`'s dialog logic: `role="dialog"`, `lib/focusTrap`, Esc, focus restore. Extract it into a small hook so it isn't duplicated. `Overlay` captures the opener once on mount, but the window now stays mounted, so the hook must capture it each time the window opens.
- [ ] Tab list from one array, holding only tabs that have a route (D6). Today that's Task Board and Codebase.

### 3. Keep the open file
- [ ] Opening Codebase without `?file=`, from a tab or the room hotspot, reopens the last file. A `?file=` in the link, such as a Task Board focus-file link, wins.
- [ ] If the last file isn't in the current file list, as after a new task, fall back to the first focus file.
- [ ] A hidden page still sees the current URL. Check that hidden Codebase doesn't fetch or change file while another tab is showing.

### 4. Migrate panels
- [ ] Migrate `TaskBoardPage` and `CodebaseExplorerPage`. Remove `Overlay`'s `wide` prop once nothing uses it.
- [ ] `EndOfDayPage` keeps `Overlay` with a scrim, per Figma: it isn't a tab. `ProfilePage` keeps `Overlay` until part B.

### 5. Tests
- [ ] Active tab has `aria-current`; link targets; tabs replace history; Esc and Back navigate to `/room`; focus trap and restore on every open; room is inert only while a panel shows; hidden tabs can't take focus; last file restored after a tab switch and after reopening; data refetches when a tab comes back; missing last file falls back.

### 6. Docs
- [ ] `frontend/SPEC.md`: routing table, adding `/room/vcs` as Phase 4's URL (no route code yet); shell component table; note that `Overlay` is now for full-screen moments only.
- [ ] `frontend/SPEC.md`, Codebase Explorer: replace "refresh, deep links and Back keep it" with what's now true. Refresh and deep links keep the file. Back steps through files picked in the explorer, then closes the panel. Tab switches use `replace`, and visited tabs stay alive until the player leaves the room or refreshes.
- [ ] `CHANGELOG.md`.

## Files affected
New: `frontend/src/components/PanelWindow.tsx`, a small dialog hook in `frontend/src/hooks/`, tests.
Changed: `frontend/src/App.tsx`, `frontend/src/components/Overlay.tsx`, `frontend/src/pages/{GameRoomPage,TaskBoardPage,CodebaseExplorerPage}.tsx`, `frontend/SPEC.md`, `CHANGELOG.md`.

## Verification
- `npm test`, `npm run test:coverage`, `npm run lint`, `npm run build` pass.
- Compare with Figma 14:182 and 15:241 at 1440×900 for the chrome only, and check 1280 wide.
- `RoomHud` fits above the window's 80px top inset at 1280 and 1440 wide.
- Manual walk: open each panel from the room hotspot, switch tabs, refresh on each URL, use browser Back, Esc, and keyboard-only Tab through the window.
- Open folders and scroll in Codebase, then switch tabs, close and reopen the panel: everything is as it was left.
- Deep links `/room/task` and `/room/codebase?file=…` work after login.

## Risks
- `useProgress` refetches when a panel opens or closes, and `useSessionFlow` re-runs on panel changes (card 37). Check that tab switches don't add requests.
- Nobody has built this yet. Hiding a tab runs its cleanup code, and the Monaco wrapper may destroy the editor at that point. Browsers may also not keep scroll on hidden elements. Step 1 checks both before panels are migrated.
- Kept tabs use more memory. Only visited tabs are kept.

## Done when
1. All tool panels use one `PanelWindow` with working tabs and one URL per tab.
2. A tab starts from where it was left after a tab switch and after closing and reopening the panel: open file, expanded folders and scroll position.
3. Dialog behaviour from Phase 7 still passes its tests.
4. `frontend/SPEC.md` routing matches `App.tsx` and names `/room/vcs`.
5. This work's card is moved per the `AGENTS.md` workflow.

---

# Part B: App Bar and standalone Profile (doesn't block Phase 4)

**Card:** [App Bar and Profile](https://trello.com/c/Jgp2Utrw). Start any time after part A, and no later than Phase 6's Profile work.
**Needs:** part A merged. Decision D7.

## Steps

### 1. `AppBar` (replaces `RoomHud`)
- [ ] 61px high, `bg-bg-surface`, bottom border. Logo in `font-display`, breadcrumb "Room / <panel>", streak pill with `flame`, XP pill, avatar.
- [ ] Keep the "wrap up the day" link after an approval.
- [ ] Level: show the placeholder "LV X" next to the real total XP (D7). No backend change.
- [ ] Apply D7 for Log out.
- [ ] Keep a route to Profile from the avatar. `RoomHud` holds the only Profile link today, and the P hotspot and shortcut don't exist yet (Main Room hub, card 37).
- [ ] The bar stays inert while a panel is open.
- [ ] Tests: breadcrumb per route; hides stats when `progress` is null (as `RoomHud` does); wrap-up link appears only after an approval; Log out and Profile reachable from the room.

### 2. Standalone Profile
- [ ] Route `/profile` under `ProtectedRoute`, rendering `AppBar` and the existing profile content in a page layout. Content stays as is; Screen 8's content comes with Phase 6.
- [ ] `/room/profile` redirects to `/profile`. Update the `AppBar` links.
- [ ] Tests: `/profile` renders; `/room/profile` redirects; unauthenticated access stays protected.

### 3. Docs
- [ ] `frontend/SPEC.md`: routing and shell component tables. `CHANGELOG.md`.

## Files affected
New: `frontend/src/components/AppBar.tsx`, tests.
Changed: `frontend/src/App.tsx`, `frontend/src/pages/{GameRoomPage,ProfilePage}.tsx`, `frontend/SPEC.md`, `CHANGELOG.md`.
Removed: `frontend/src/game/RoomHud.tsx`.

## Verification
- `npm test`, `npm run test:coverage`, `npm run lint`, `npm run build` pass.
- Compare the bar with Figma 46:9 at 1440×900, and check 1280 wide.
- Deep link `/profile` works after login.

## Risks
- `useSessionFlow` opens the Task Board once per session and refers to room paths, so recheck it after the Profile move.
- `useProgress` is fetched by the room today, so the standalone Profile needs its own fetch for the App Bar.
- `/profile` is outside `/room`, so going there unmounts `PanelWindow` and drops kept tabs. Before this ships, move the kept tabs above both routes, or get an owner decision to accept the loss.

## Done when
1. `AppBar` shows on the room, panels and Profile.
2. Log out and Profile are reachable.
3. `/profile` is standalone.
4. `frontend/SPEC.md` routing matches `App.tsx`.
5. Card [App Bar and Profile](https://trello.com/c/Jgp2Utrw) is moved per the `AGENTS.md` workflow.
