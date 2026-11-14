# P5-04 — Reviewer Prompt, Guidelines & Ollama Adapter

**Phase:** 5 — AI Review Engine
**Status:** ⬜ Not started
**Depends on:** P5-01 (Ollama works), P5-02 (`ReviewAiPort`)

---

## Goal

Make the AI senior dev review real code. "Feedback is the product" (north star), so this task is judged on the quality of the reviews, not just on a working call.

---

## Acceptance Criteria

- [ ] `docs/code-review-guidelines.md`: what a Java / Spring Boot Junior review checks (correctness against the criteria, validation, error handling, naming, tests, layering in `shopfront`). It is loaded into the prompt, so keep it short
- [ ] `prompts/code-reviewer.txt`: task, criteria, the focus-file originals, the pushed files with line numbers, and the guidelines → a JSON result: `verdict`, `summary`, `comments[{path, line, severity, body}]`, `criteria[{position, met}]`
- [ ] Tone from the Design Spec "Senior Dev" voice: specific, constructive, cites file:line, and at least one Praise when something was done well
- [ ] `OllamaReviewAdapter` implements `ReviewAiPort`, selected by `codingtycoon.ai.provider=ollama`. It asks Ollama for JSON output and maps it to `ReviewResult`; unparseable output returns `Optional.empty()` (the worker counts it as a failure)
- [ ] Fault tolerance as in P5-01. The review timeout is its own config key, longer than task generation, set from the P5-01 latency
- [ ] The prompt fits the model's context: pushed files are capped by the 64 KB push limit; if the prompt would exceed the configured context size, the adapter fails fast instead of sending a truncated review
- [ ] `backend/evals/review/`: at least 5 cases on seed tasks (a correct solution, a missing criterion, a bug, missing validation, a no-op change), each with the expected verdict. A script runs them against a real Ollama and prints verdict and latency. It runs by hand, not in CI
- [ ] Unit tests with a mocked model: JSON mapping, malformed JSON, missing fields, unknown severity
- [ ] `backend/SPEC.md`, `CHANGELOG.md`

---

## Decisions

- **JSON output, validated twice**: by the adapter (shape) and by the worker (paths, lines, criteria count). Small models drift, so neither check is optional.
- **Evals by hand for the MVP**: they need a real model, and CI must not. Their result is recorded in the Result section to show review quality.
- **Skill profile isn't in the prompt yet**: that is Phase 6.

---

## Definition of Done

All eval cases give the expected verdict on staging (or the misses are recorded with a decision), and a real push on staging gets an AI review shown in the Review tab.
