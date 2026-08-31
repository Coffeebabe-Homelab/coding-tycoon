# Agent Guidelines for project development

Guidelines for AI agents and humans working on this codebase.

## At a Glance

- Ask rather than guess; clarify before coding.
- One focused change at for each commit (< 100 lines).
- Minimal code; comments explain why, not what.
- Public APIs: typed, stable, documented.
- Development flow: Test -> Red -> fix -> green
- Tests 80% of code, prioritize critical sections
- If using patters do not over engineer, keep it Simple.
- Use explicit imports.
- Stream large data; avoid shared mutable state across threads.

## Critical Principles

- Ask Rather Than Guess:
  - Clarify requirements, edge cases, success criteria before coding.
  - If the request is ambiguos ask first, keep record.
  - Propose options and trade-offs if not defined.
- Minimal Code:
  - Keep code self-explanatory; comments only for rationale, edge cases, or workarounds.
- One Change at a Time:
  - Single concern per edit; keep diffs small and reviewable, commit if necessary.
- Human Changes Precedence:
  - Respect human edits unless they contradict tests/specs. If reverting, justify briefly.

## Daily Workflow

- Run tests; ensure coverage complies.
- When asked to change add to `CHANGELOG.md`

## Project Style

- Function must have single responsability.
- Naming:
  - Functions: `camelCase`;
  - Classes: `PascalCase`; Constants: `SCREAMING_SNAKE_CASE`;
- Documentation:
  - Keep simple and clean.

## Design Patterns

- Prefer composition over inheritance.
- Extract reusable logic to avoid repetition (DRY).

## Engineering Practices

- Testing:
  - Execute every line; cover all branches (normal, error, early return).
- CI and Automation:
  - Test on supported Java versions (e.g., 25/LTS), collect coverage, run Jacoco, build docs.

## Imports and Dependencies

- Minimize dependencies; pin versions;

## Documentation Policy

- Keep SPEC.md always up to date.
- For any PLAN.md executed save it with the correct name after implementation for history tracking

## Logging

- Use `trace` only when required and tracking.
- Use `debug` only when developing and for points of variable hard manipulation 
- Use `info` for importante flow.
- Use `warn` for recoverable failures.
- Use `error` for critical failure.

## Backend

### Practices

- Keep it simple
- Do not repeat yourself

### Code Organization

- Use domain driven desing.
- Keep things well defined so if the future demands decoupling it's not hard.

## Frontend

### Practices

- Explain while doing
- Never expose secrets
- Assume the user does not know frontend so he'll need guidance on making decisions for it. Explain pros and cons before and let him make the decision

## Service Patterns

- Externalize config;
- Do not expose secrets

## Code Review Checklist (short)

- Intent clarified; minimal code; single concern; small diff.
- Naming/formatting follow conventions.
- Appropriate exceptions and validations with clear messages.
- Tests cover defined coverage for lines and branches
- Explicit imports; clear organization; CI covers tests, coverage, docs.

## Summary

- Ask first. Keep code minimal. Make small, focused edits.
- Keep the repo formatted, simple, dry, tested, and green.
