# P5-04 — Reviewer Prompt, Guidelines & Ollama Adapter

**Phase:** 5 — AI Review Engine
**Status:** 🔄 In progress: code done; review quality below target, owner decision pending; staging evals pending
**Depends on:** P5-01 (Ollama works), P5-02 (`ReviewAiPort`)

---

## Goal

Make the AI senior dev review real code. "Feedback is the product" (north star), so this task is judged on the quality of the reviews, not just on a working call.

---

## Acceptance Criteria

- [x] Review guidelines (in `backend/src/main/resources/review/code-review-guidelines.md`, see Result): what a Java / Spring Boot Junior review checks (correctness against the criteria, validation, error handling, naming, tests, layering in `shopfront`). It is loaded into the prompt, so keep it short
- [x] `prompts/code-reviewer.txt`: task, criteria, the focus-file originals, the pushed files with line numbers, and the guidelines → a JSON result: `verdict`, `summary`, `comments[{path, line, severity, body}]`, `criteria[{position, met}]`
- [x] Tone from the Design Spec "Senior Dev" voice: specific, constructive, cites file:line, and at least one Praise when something was done well
- [x] `OllamaReviewAdapter` in `ai.ollama` implements `ReviewAiPort`, selected by `codingtycoon.ai.provider=ollama`, and passes the shared `ReviewAiPort` contract test from P5-02. It asks Ollama for JSON output and maps it to `ReviewResult`; unparseable output returns `Optional.empty()` (the worker counts it as a failure)
- [x] Fault tolerance as in P5-01. The call uses `codingtycoon.review.timeout` from P5-03, set from the P5-01 latency
- [x] The prompt fits the model's context: pushed files are capped by the 64 KB push limit; if the prompt would exceed the configured context size, the adapter fails fast instead of sending a truncated review
- [x] `backend/evals/review/`: at least 5 cases on seed tasks (a correct solution, a missing criterion, a bug, missing validation, a no-op change), each with the expected verdict. A script runs them through `ReviewAiPort` against the configured provider and prints verdict, latency and whether it beat the target. It runs by hand, not in CI, and works for any future provider
- [x] Unit tests with a mocked model: JSON mapping, malformed JSON, missing fields, unknown severity
- [x] `backend/SPEC.md`, `CHANGELOG.md`

---

## Decisions

- **JSON output, validated twice**: by the adapter (shape) and by the worker (paths, lines, criteria count). Small models drift, so neither check is optional.
- **Evals by hand for the MVP**: they need a real model, and CI must not. Their result is recorded in the Result section to show review quality.
- **Skill profile isn't in the prompt yet**: that is Phase 6.

---

## Result

### Decisions made while building
- **Guidelines live in backend resources**, not `docs/`: the backend image copies only `backend/src`, and the guidelines are loaded into every `ReviewRequest`.
- **Timeout from `codingtycoon.review.timeout`** through a programmatic `TypedGuard`: the annotation can't read a duration like `5m`. Retry only on an unreachable server. **No circuit breaker**: the queue's doubling backoff already spaces out calls to a model that is down.
- **Context budget:** `OLLAMA_NUM_CTX=8192`, `OLLAMA_NUM_PREDICT=1024`, at 3 characters per token. A longer prompt isn't sent; the review fails, retries and ends `FAILED`. The 8192 context needs about 4 GB of RAM on top of the model.
- **Prompt injection:** placeholders are filled in one pass, and the pushed code is framed as data to review.

### Evals, local (Apple M4, Metal, Ollama 0.21.1, deepseek-coder 6.7B Q4_K_M, 2026-11-14)

| Case | Expected | Run 1 (first prompt) | Run 2 (paths, count and verdict rule spelled out) | Seconds (run 2) |
|---|---|---|---|---|
| 1-validation-correct | APPROVED | APPROVED | APPROVED | 31 |
| 2-validation-missing | CHANGES_REQUESTED | APPROVED | APPROVED | 32 |
| 3-validation-no-op | CHANGES_REQUESTED | CHANGES_REQUESTED | APPROVED | 31 |
| 4-list-users-correct | APPROVED | invalid: path `com/shop/…` | APPROVED | 60 |
| 5-list-users-bug | CHANGES_REQUESTED | invalid: 3 of 5 criteria | APPROVED | 58 |
| 6-list-users-no-test | CHANGES_REQUESTED | APPROVED | invalid: comment on a file not pushed | 64 |
| **As expected** | | **2 of 6** | **2 of 6** | all over the 30 s target |

- The answer format is fixed: usable answers went from 3 to 5 of 6.
- **The verdict is not:** the model approves almost everything, including a no-op and a bug. It even wrote "APPROVED" next to its own MUST_FIX in run 1. This is the model's judgement, not parsing.
- **Latency on a GPU is 30–64 s**, so it is already over the 30 s target. CPU staging will be several times slower, and the 5 min timeout may need raising.

**Decision pending (owner):** what to do about review quality before P5-06. The options are a better model (config only, e.g. a newer or larger coder model), a lower temperature, a code-side verdict rule (CHANGES_REQUESTED when any criterion is unmet or any comment is MUST_FIX), or accepting it for the MVP. Record the staging eval table here too.

## Definition of Done

All eval cases give the expected verdict on staging (or the misses are recorded with a decision), and a real push on staging gets an AI review shown in the Review tab.
