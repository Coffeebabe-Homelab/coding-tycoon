# P5-07 — AI Observability (metrics and Grafana)

**Phase:** 5 — AI Review Engine
**Status:** ⬜ Not started
**Depends on:** P5-03 (the review worker and queue exist). Decided by the owner on 2026-11-14.

---

## Goal

See how the AI behaves on staging in the LGTM stack: how long calls take compared with the target, how often they fall back or fail, and how long players wait in the review queue. This is what we tune `codingtycoon.review.target-duration` and the timeouts with.

---

## Already there

- **Traces:** `quarkus-langchain4j` adds a span per model call through OpenTelemetry (model, duration, input and output tokens). Prompt and answer text stay **out** of spans (the default): they contain the player's code. Check this in Tempo on staging; don't turn text on.

---

## Acceptance Criteria

### Metrics (OpenTelemetry Meter, exported over OTLP like the rest of the backend)
- [ ] `ai.call.duration` histogram (seconds), attributes `port` (`task`, `review`), `provider` (`stub`, `ollama`) and `outcome` (`ok`, `timeout`, `unavailable`, `invalid`, `circuit_open`). Recorded in one place in the `ai` package, so every adapter and future provider gets it the same way
- [ ] `ai.call.fallbacks` counter: calls that ended with no result (seed task used, review retried), by `port` and `outcome`
- [ ] `review.queue.wait` histogram: from push to the worker claiming the review
- [ ] `review.duration` histogram: from claim to verdict, plus `review.over_target` counter against `codingtycoon.review.target-duration`
- [ ] `review.queue.depth` gauge: `PENDING` and `RUNNING` reviews, through the `ReviewQueue` port (so a future broker adapter reports it too)
- [ ] `review.outcomes` counter by `verdict` and by final status (`DONE`, `FAILED`)
- [ ] No player data in attributes: no sub, email, task text or code. Review and task ids only in logs and spans

### Dashboard
- [ ] An **AI** row in the LGTM-01 dashboard (`observability/dashboards/`):
  - call latency p50 / p95 by port, with the review target as a line
  - outcomes and fallbacks over time
  - review queue depth and wait time
  - reviews over target, and failures
  - tokens per call, from the trace spans (Tempo)
- [ ] `observability/README.md`: the metric names, and how to read the AI row when tuning the target

### Quality
- [ ] Tests for the recording (an in-memory OTel exporter or a test `MeterProvider`): each outcome is counted once with the right attributes
- [ ] `backend/SPEC.md`, `CHANGELOG.md`

---

## Decisions

- **Our own OTel metrics, not Micrometer**: the backend already exports through OpenTelemetry; a second metrics stack isn't worth it, and only our code knows about fallbacks, retries and the queue.
- **After P5-03**: the queue and review metrics need the worker. Task generation is measured in the same task, so the AI row is built once.

---

## Definition of Done

On staging, the AI row shows real task-generation and review calls, the queue depth moves while a review runs, and a review past the target appears as over target.
