# P5-02 — Review Domain & API

**Phase:** 5 — AI Review Engine
**Status:** 🔄 In progress: code done, staging check pending (a push creates a `PENDING` review)
**Depends on:** P4-02 (submissions). Not on P5-01: the stub reviewer needs no AI.

---

## Goal

Store reviews and let the frontend read them. A push queues a review automatically (owner, 2026-11-14), so there is no trigger endpoint. A stub reviewer lets the whole loop run, and be tested, without Ollama.

---

## Acceptance Criteria

### Data (Flyway `V11`)
- [x] `reviews`: `id`, `submission_id` (FK, `ON DELETE CASCADE`, **unique**: one review per attempt), `status` (`PENDING`, `RUNNING`, `DONE`, `FAILED`), `verdict` (`APPROVED`, `CHANGES_REQUESTED`, null until `DONE`), `summary` (one line for the verdict card), `failure_count`, `next_attempt_at`, `created_at`, `started_at`, `reviewed_at`, all UTC
- [x] `review_comments`: `review_id` (FK, cascade), `path`, `line` (1-based, in the pushed file), `severity` (`MUST_FIX`, `SUGGESTION`, `PRAISE`), `body`
- [x] `review_criteria`: `review_id` (FK, cascade), `position` (index in the task's criteria list), `met` (boolean). This ticks the ticket's criteria on Screen 7
- [x] An index on `reviews (status, next_attempt_at)` for the worker in P5-03

### Domain
- [x] New `review` package with the SPEC layering: `Review` entity, `ReviewRepository` port with a JPA adapter, `ReviewService`, `ReviewResource`
- [x] `ReviewAiPort`: takes a `ReviewRequest` (task title, description, criteria, focus-file originals, pushed files, guidelines) and returns `Optional<ReviewResult>` (verdict, summary, comments, criteria met). No AI types in the domain
- [x] `StubReviewAdapter` in `ai.stub`, selected by `codingtycoon.ai.provider=stub` (the default, as in P5-01), passing a shared `ReviewAiPort` contract test. It is deterministic: it returns `CHANGES_REQUESTED` on attempt 1 and `APPROVED` from attempt 2, with one comment of each severity on the first pushed file, so both paths can be played on staging without a model

### Queueing (behind a port, owner 2026-11-14)
- [x] `ReviewQueue` port in the `review` domain, with only our own types:
  - `enqueue(reviewId)`: called inside the push transaction
  - `claimNext()` → `Optional<ClaimedReview>`: takes the next review for a worker
  - `complete(reviewId)`, `retryLater(reviewId, delay)`, `releaseStuck(runningFor)` (puts back reviews whose worker stopped; the worker can't know their ids)
- [x] `DbReviewQueue` adapter (`review.queue.db`): the `reviews` table is the queue (`status`, `created_at`, a `next_attempt_at` column). It also works as an outbox if a broker comes later: a relay would publish enqueued rows, and the domain wouldn't change
- [x] `POST /api/submissions` saves the review and calls `ReviewQueue.enqueue` **in the same transaction** as the submission, so a push can't exist without its review
- [x] Nothing else creates reviews. There is no `POST /api/reviews/trigger`
- [x] A shared contract test for `ReviewQueue` adapters: enqueue → claim, no double claim, retry-later is not claimable before its time, a stuck review is put back, two workers never claim the same review

### API
- [x] `GET /api/reviews/latest` (authenticated): the latest review of the player's active task, or the task just approved today. `200` with `{ id, submissionId, attemptNumber, status, verdict, summary, comments[], criteria[], createdAt, reviewedAt, targetSeconds }`, comments sorted Must fix → Suggestion → Praise, then by path and line. `204` when the task has no push yet
- [x] `targetSeconds` is the tunable review target from P5-03, so the UI can say when a review takes longer than usual
- [x] Only the owner's reviews are visible: another player's review is never returned
- [x] A `FAILED` review is returned with its status and no verdict, so the UI can show Screen 11b

### Docs
- [x] `backend/SPEC.md` (package, endpoints, data model), `CHANGELOG.md`

---

## Decisions

- **Review queued on push** (owner): no public endpoint that starts expensive model calls; the queue row survives a backend restart.
- **One review per submission**: a failed review is retried on the same row, so our failures never cost the player an attempt (Design Spec, Screen 11b).
- **Line numbers refer to the pushed file**, the "modified" side of the diff, which is where the Review tab anchors threads.
- **Queue behind a port**: today the worker runs in the backend on the DB queue; moving to a broker or a separate worker service means a new `ReviewQueue` adapter (and maybe deploying the worker apart), not a domain change.
- **Criteria are stored by position**: task criteria are a newline-separated string today (`splitCriteria`), with no ids.

---

## Result

- `GET /api/reviews/latest` uses the player's **newest** task (active or approved), so "the task just approved today" needs no date rule: the next day's task replaces it once created.
- `ReviewQueue.release(id)` became `releaseStuck(runningFor)`: a restarted worker can't know which ids it held.
- The submission domain doesn't import reviews: it fires a synchronous `SubmissionPushed` CDI event, observed inside the push transaction. If queueing fails, the push returns 500 and nothing is stored.
- Verified by `./mvnw clean verify`: 254 tests, every package at 80% or more.

## Definition of Done

A push on staging creates a `PENDING` review, `GET /api/reviews/latest` returns it, tests cover the queueing and the visibility rules, and coverage stays at 80% or more.
