# P7-05 — End of Day Screen

**Phase:** 7 — Game Shell  
**Status:** 🔲 Not started  
**Depends on:** P7-02, P7-03, P7-04  

---

## Goal

Close each session with a summary that feels like the end of a workday: what happened to today's task, XP earned, and the streak.

---

## Acceptance Criteria

- [ ] `types/progress.ts` and `hooks/useProgress.ts` (`GET /api/progress` via `fetchWithAuth`)
- [ ] `pages/EndOfDayPage.tsx` at `/room/end-of-day` (protected), opened from the room's door hotspot and offered after a task is approved
- [ ] Shows: today's task title and status, XP gained today, total XP, current streak (and longest)
- [ ] Copy reflects the outcome: approved, still in progress, or no task started
- [ ] Skill profile delta section is hidden until Phase 6 provides data (no placeholder text pretending data exists)
- [ ] Actions: "Back to room" and "Log out"
- [ ] HUD in the room shows total XP and current streak (reuses `useProgress`)
- [ ] Loading/error states follow existing patterns; semantic tokens only

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
