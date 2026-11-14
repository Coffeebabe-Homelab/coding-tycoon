# P5-02 — Review Domain & API

**Phase:** 5 — AI Review Engine
**Status:** ⬜ Not started
**Depends on:** P4-02 (submissions). Not on P5-01: the stub reviewer needs no AI.

---

## Goal

Store reviews and let the frontend read them. A push queues a review automatically (owner, 2026-11-14), so there is no trigger endpoint. A stub reviewer lets the whole loop run, and be tested, without Ollama.

---

## Acceptance Criteria

### Data (Flyway `V11`)
- [ ] `reviews`: `id`, `submission_id` (FK, `ON DELETE CASCADE`, **unique**: one review per attempt), `status` (`PENDING`, `RUNNING`, `DONE`, `FAILED`), `verdict` (`APPROVED`, `CHANGES_REQUESTED`, null until `DONE`), `summary` (one line for the verdict card), `failure_count`, `created_at`, `started_at`, `reviewed_at`, all UTC
- [ ] `review_comments`: `review_id` (FK, cascade), `path`, `line` (1-based, in the pushed file), `severity` (`MUST_FIX`, `SUGGESTION`, `PRAISE`), `body`
- [ ] `review_criteria`: `review_id` (FK, cascade), `position` (index in the task's criteria list), `met` (boolean). This ticks the ticket's criteria on Screen 7
- [ ] An index on `reviews (status, created_at)` for the worker in P5-03

### Domain
- [ ] New `review` package with the SPEC layering: `Review` entity, `ReviewRepository` port with a JPA adapter, `ReviewService`, `ReviewResource`
- [ ] `ReviewAiPort`: takes a `ReviewRequest` (task title, description, criteria, focus-file originals, pushed files, guidelines) and returns `Optional<ReviewResult>` (verdict, summary, comments, criteria met). No AI types in the domain
- [ ] `StubReviewAdapter`, selected by `codingtycoon.ai.provider=stub` (the default, as in P5-01): deterministic. It returns `CHANGES_REQUESTED` on attempt 1 and `APPROVED` from attempt 2, with one comment of each severity on the first pushed file, so both paths can be played on staging without a model

### Queueing
- [ ] `POST /api/submissions` saves a `PENDING` review **in the same transaction** as the submission, so a push can't exist without its review
- [ ] Nothing else creates reviews. There is no `POST /api/reviews/trigger`

### API
- [ ] `GET /api/reviews/latest` (authenticated): the latest review of the player's active task, or the task just approved today. `200` with `{ id, submissionId, attemptNumber, status, verdict, summary, comments[], criteria[], createdAt, reviewedAt }`, comments sorted Must fix → Suggestion → Praise, then by path and line. `204` when the task has no push yet
- [ ] Only the owner's reviews are visible: another player's review is never returned
- [ ] A `FAILED` review is returned with its status and no verdict, so the UI can show Screen 11b

### Docs
- [ ] `backend/SPEC.md` (package, endpoints, data model), `CHANGELOG.md`

---

## Decisions

- **Review queued on push** (owner): no public endpoint that starts expensive model calls; the queue row survives a backend restart.
- **One review per submission**: a failed review is retried on the same row, so our failures never cost the player an attempt (Design Spec, Screen 11b).
- **Line numbers refer to the pushed file**, the "modified" side of the diff, which is where the Review tab anchors threads.
- **Criteria are stored by position**: task criteria are a newline-separated string today (`splitCriteria`), with no ids.

---

## Definition of Done

A push on staging creates a `PENDING` review, `GET /api/reviews/latest` returns it, tests cover the queueing and the visibility rules, and coverage stays at 80% or more.
