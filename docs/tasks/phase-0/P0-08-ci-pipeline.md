# P0-08 — CI Pipeline (GitHub Actions)

**Phase:** 0 — Foundation  
**Status:** ✅ Complete  
**Depends on:** P0-01, P0-02  

---

## Goal

A GitHub Actions CI pipeline that runs on every push and pull request. It builds and lints the frontend, and builds and tests the backend. Every PR must be green before merging.

---

## Acceptance Criteria

- [x] `.github/workflows/ci.yml` exists
- [x] Pipeline triggers on `push` and `pull_request` to `main`
- [x] Frontend job: `npm ci` → `npm run lint` → `npm run build`
- [x] Backend job: `./mvnw verify` (compiles + runs tests)
- [x] Backend tests use Dev Services (Testcontainers) — no external DB needed in CI
- [x] Pipeline passes on the current scaffolded code
- [ ] Branch protection rule on `main`: require CI green before merge (document in README, configure manually in GitHub)
- [x] Build badge added to `README.md`

---

## Implementation Notes

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run build

  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: 21
          distribution: temurin
          cache: maven
      - run: ./mvnw verify -B
```

**Testcontainers in CI:** GitHub Actions runners have Docker available — Quarkus Dev Services (Testcontainers) works out of the box. No additional setup needed.

**Secrets:** Auth0 credentials are not needed for CI tests — use `@TestSecurity` to mock auth in integration tests (see P0-07).

---

## Notes

- Keep CI fast: target < 5 minutes total. Use caching aggressively (node_modules, Maven `.m2`).
- Ollama AI tests should be skipped in CI (mock the AI service interface in tests, don't call real Ollama).
- Add a `ci` Maven profile if needed to exclude AI-dependent tests.

---

## Definition of Done

- Both jobs pass on a push to main. Pipeline visible in GitHub Actions tab.

---

## Closure Note (2026-11-01)

Branch protection is manual GitHub configuration and can't be verified from the repo; confirm it in the GitHub settings. A Jenkins pipeline (`Jenkinsfile`) was added in Phase 2.1: it validates `dev`, merges into `staging` after approval, deploys, and runs the smoke test.
