# P5-05 — Review Tab UI

**Phase:** 5 — AI Review Engine
**Status:** ⬜ Not started
**Depends on:** P5-02 (API). Can be built against the stub reviewer before P5-03/P5-04 land.

---

## Goal

The Review tab (`/room/review`) shows the senior dev's verdict and comments, anchored to the code, and names the next step. Build it to Figma Screens 7a (Changes requested), 7b (Approved) and 11b (review service offline). The Design Spec calls this loop "the core of the game — give it the most care".

---

## Acceptance Criteria

### Tab and loading
- [ ] `/room/review` → `ReviewPage`, the fifth panel tab, kept alive with `<Activity>` like the others
- [ ] `useReview` hook: `GET /api/reviews/latest`. While the status is `PENDING` or `RUNNING`, it polls every 3 s, and stops when the tab is hidden or the review is `DONE` or `FAILED` (owner chose polling, 2026-11-14)
- [ ] Pending state: "Senior dev is reviewing attempt N…" with the time since the push. Past `targetSeconds` it adds "taking longer than usual — you can leave, it keeps going". No spinner-only screen: on CPU this can take minutes
- [ ] No push yet: points to the VCS tab
- [ ] After a push, the VCS toast links to the Review tab, and its wording changes from "waiting for review" to "in review"

### Verdict (sidebar, 300 px)
- [ ] Verdict card first: status badge, H2, the one-line summary, tinted in the verdict colour
- [ ] Attempt counter: three dots, past attempts muted, the current one in the verdict colour, the next outlined. With more than three attempts the dots show the last three and a count ("attempt 4")
- [ ] Criteria: the ticket's criteria (`CriteriaItem`), ticked from `criteria[].met`
- [ ] Next step: Changes requested → "Fix in editor" (opens `/room/editor`; the files are editable again and start from the last push). Approved → "Ship it & end the day" (opens End of Day)

### Threads
- [ ] One thread per comment: file:line header, 2–3 lines of the pushed file around the line as Diff Lines, then the `ReviewComment` (Must fix / Suggestion / Praise) indented under the code
- [ ] Sorted Must fix → Suggestion → Praise, as the API returns them
- [ ] Each thread header opens that file in the Editor at that line (`?file=`, plus the line)

### Failure (Screen 11b)
- [ ] A `FAILED` review shows that the review service is offline, that the push is kept and didn't use an attempt, and a "Retry" button (`POST /api/reviews/{id}/retry`), which resumes polling

### Quality
- [ ] Keyboard: every action reachable by Tab, focus moves to the verdict card when a review arrives, and the verdict is announced (`role="status"`)
- [ ] Tests for each state: none, pending (polling starts and stops), changes requested, approved, failed with retry
- [ ] New components where Figma has them (`ReviewComment`, `DiffLine`, `AttemptDots`) with their own tests; `frontend/SPEC.md` routes, components and state; `CHANGELOG.md`

---

## Decisions

- **Polling at 3 s** while pending: simple, works through nginx and Auth0 unchanged. Server push is a later option if needed.
- **Threads show pushed code, not a full diff**: the full diff lives in the VCS tab; the review shows what the comment is about.

---

## Definition of Done

Both verdict paths and the failure state work on staging and match Screens 7a, 7b and 11b at 1440×900 (checked at 1280), with tests for every state.
