# P5-03 — Review Worker, Verdict & XP

**Phase:** 5 — AI Review Engine
**Status:** 🔄 In progress: code done, staging check pending
**Depends on:** P5-02. Timeouts come from the latency recorded in P5-01.

---

## Goal

Run queued reviews in the background, apply the verdict to the task, and award XP on approval, including the first-try bonus deferred from P7-03.

---

## Acceptance Criteria

### Worker
- [x] A scheduled worker (`quarkus-scheduler`, package `review.worker`) depends only on the `ReviewQueue` and `ReviewAiPort` ports and `ReviewService`, never on JPA, HTTP resources or a provider. That keeps it movable to its own service later
- [x] `DbReviewQueue.claimNext()` takes the oldest due `PENDING` review with `SELECT … FOR UPDATE SKIP LOCKED`, marks it `RUNNING` and sets `started_at`, in a short transaction. Two backend instances can't take the same review
- [x] One review at a time per instance: the CPU-only staging host can't run several models at once. Not configurable per instance: scale out with instances (see Result)
- [x] The `ReviewAiPort` call runs **outside** any transaction (same trap as P5-01)
- [x] The result is validated before it is saved: the verdict is set, every comment's path is one of the pushed files, every line is within that file, the criteria count matches the task's. Invalid output counts as a failure
- [x] On success, one transaction: save the result, set `DONE` and `reviewed_at`, and call `TaskService.applyReviewVerdict` (it exists and already awards XP on approval)
- [x] On failure (timeout, outage, invalid output): increment `failure_count` and call `ReviewQueue.retryLater` with a backoff. After `codingtycoon.review.max-failures` (default 3) it becomes `FAILED`. The task stays `SUBMITTED` and the attempt number doesn't change
- [x] A review stuck in `RUNNING` (backend restarted mid-call) goes back to `PENDING` after a configured timeout
- [x] `POST /api/reviews/{id}/retry` (owner only): puts a `FAILED` review back to `PENDING` with `failure_count` reset. `422` for any other status. This is the "Retry" on Screen 11b; it starts no model call itself

### Timing (tunable on staging, owner 2026-11-14)
- [x] `codingtycoon.review.target-duration` (default `30s`, env `CODINGTYCOON_REVIEW_TARGET_DURATION`): how long a review should take. It is not a timeout. A review over the target logs a `warn` with its duration (the "reviews over target" metric is P5-07), and the Review tab shows "taking longer than usual" past it (`targetSeconds` in the API)
- [x] `codingtycoon.review.timeout` (env `CODINGTYCOON_REVIEW_TIMEOUT`): the hard limit on one model call, after which it counts as a failure. Startup fails with a clear message if it is shorter than the target
- [x] `codingtycoon.review.max-failures`, `codingtycoon.review.stuck-after` and the poll interval of the worker are config too. All are documented in `docs/STAGING_DEPLOY.md` with their env names, and can be changed in the staging `.env` without a rebuild

### XP
- [x] New `XpReason.FIRST_TRY_BONUS`, paid once per task when it's approved on attempt 1. The amount is a constant next to `XP_PER_APPROVED_TASK`
- [x] `GET /api/progress` totals include the bonus, so the HUD and End of Day match (the P7-06 check)

### Observability
- [x] `info` log per review: id, attempt, verdict, duration. `warn` per failure with its reason
- [ ] ~~A metric for review duration and failures~~ → moved to P5-07, which owns every AI and review metric (`review.duration`, `review.over_target`, `review.outcomes`), so they are built once

### Docs
- [x] `backend/SPEC.md` (worker, statuses, retry endpoint, config keys), `CHANGELOG.md`

---

## Decisions

- **No cap on attempts** (owner, 2026-11-14): the player iterates until approved. Only attempt 1 earns the first-try bonus.
- **DB table as the queue**, not a message broker: one moving part fewer for the MVP, and restart-safe. A broker is a production follow-up if load needs it.
- **Retry is a re-queue, not a call**: the endpoint can't be used to run the model on demand.

---

## Result

- **One review per instance, not a concurrency setting.** The scheduler skips a tick while the last one runs, so an instance runs one review at a time; more throughput means more instances, which `SKIP LOCKED` keeps apart. `OLLAMA_NUM_PARALLEL=1` serialises the model anyway. A per-instance setting can be added if a GPU host needs it.
- **The worker enforces `codingtycoon.review.timeout`** for every provider. A call past it is abandoned and counted as a failure; the Ollama adapter's own timeout (P5-04) is what ends its HTTP request.
- **Startup check:** the timeout can't be shorter than the target, and `stuck-after` must be longer than the timeout, or a review still inside its call would be put back and reviewed twice.
- **Guidelines are empty** in the `ReviewRequest` until P5-04 adds `docs/code-review-guidelines.md`.
- **Defaults:** timeout 5 min, 3 failures, backoff 30 s doubling, stuck after 10 min, poll every 5 s. Tune them on staging from the `Review N done in X ms` log lines.
- `ReviewLoopTest` plays the Definition of Done loop with the stub: push → changes requested → push → approved, ticket XP only. `./mvnw clean verify`: 292 tests, every package at 80% or more.

## Definition of Done

On staging with the stub reviewer: push → `CHANGES_REQUESTED` → edit and push → `APPROVED`, XP awarded once with the right bonus. Stopping Ollama (with `provider=ollama`) ends in `FAILED` without using up an attempt, and Retry recovers it. Tests cover claiming, success, each failure kind, stuck recovery and retry.
