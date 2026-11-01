# P7-05 — End of Day Screen

**Phase:** 7 — Game Shell  
**Status:** ✅ Complete  
**Depends on:** P7-02, P7-03, P7-04  

---

## Goal

Close each session with a summary that feels like the end of a workday: what happened to today's task, XP earned, and the streak.

---

## Acceptance Criteria

- [x] `types/progress.ts` and `hooks/useProgress.ts` (`GET /api/progress` via `fetchWithAuth`)
- [x] `pages/EndOfDayPage.tsx` at `/room/end-of-day` (protected), opened from the room's door hotspot and offered after a task is approved (HUD link "Task approved: wrap up the day", driven by `approvedTodayTaskTitle` from `GET /api/progress`)
- [x] Shows: today's task title and status, XP gained today, total XP, current streak (and longest)
- [x] Copy reflects the outcome: approved, still in progress, or no task started
- [x] Skill profile delta section is hidden until Phase 6 provides data (no placeholder text pretending data exists)
- [x] Actions: "Back to room" and "Log out"
- [x] HUD in the room shows total XP and current streak (reuses `useProgress`)
- [x] Loading/error states follow existing patterns; semantic tokens only

---

## File Locations

```
frontend/src/
├── types/progress.ts
├── hooks/useProgress.ts
├── pages/EndOfDayPage.tsx
├── game/RoomScene.tsx      ← updated (door hotspot, HUD values)
└── App.tsx                 ← updated
```

---

## Definition of Done

`npm run build` and `npm run lint` pass; with a task approved through the API, the screen shows the XP gained and the updated streak.
