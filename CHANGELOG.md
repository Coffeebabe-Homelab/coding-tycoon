# Changelog

## Unreleased

- CI: the backend job writes test totals, failed tests and per-package JaCoCo coverage to the GitHub Actions job summary, including when the build fails.
- Cleanup: remove `.kiro/` and the unused `quarkus-smallrye-jwt` dependency (`quarkus-oidc` provides `JsonWebToken`). Upgrade GitHub Actions to their Node 24 releases (`checkout` v7, `setup-node` v7, `setup-java` v6) and remove a stale H2 comment from `ci.yml`.
- Docs: add the Night Shift design implementation roadmap and its four stage plans in `docs/design/`.
- Frontend tests: add Vitest and React Testing Library with first tests for `lib`, hooks, components and pages, plus `npm test` and `npm run test:coverage` (at least 70% on logic). Coverage runs in GitHub Actions and the Jenkins Validate stage. Known bugs are recorded as `it.fails` tests linked to their cards.
- Backend coverage: the JaCoCo report now counts plain unit tests as well as `@QuarkusTest`, and `./mvnw verify` fails if any package drops under 80% lines or 80% branches. New tests cover the task state machine, the 500 fallback, unreadable codebase files and `UserService`. Overall: 100% lines, 95.8% branches (`dev` reported 93.2% / 73.2%). By package (lines/branches): codebase 100/87.5, exception 100/100, health 100/n-a, profile 100/100, progress 100/88.9, task 100/100, task.seed 100/100, topic 100/100, user 100/n-a.
- Backend tests: keep OIDC enabled in tests against a local stub server, using `quarkus-test-oidc-server` and `quarkus-test-security-oidc` instead of `quarkus-test-security-jwt`. `OidcTokenValidationTest` sends real signed tokens and checks that a wrong issuer, wrong audience, expired token, wrong signature and malformed token all get 401. Add `ProfileServiceTest` unit tests with Mockito.
- Fix: parallel `GET /api/tasks/today` or `POST /api/tasks/generate` calls could create several active tasks for one player. Creation now locks the player's profile row. Flyway `V9` removes existing duplicates, keeping the newest, and adds a partial unique index.
- Backend tests: run on Dev Services PostgreSQL 16 with the real Flyway migrations instead of H2 with `drop-and-create`, and remove `quarkus-jdbc-h2`. Docker is now required to run them. `SchemaValidationTest` boots with `generation=validate` to catch entity/migration drift, and tests use the V5 topic seed instead of re-inserting topics.
- Backend tests: replace the hand-written fakes in `TaskServiceTest` and `CodebaseServiceTest` with Mockito mocks, keeping the same scenarios.
- Backend tests: add `quarkus-junit5-mockito` (test scope, version from the Quarkus BOM). Mocks replace hand-written fakes from now on; see the mocking convention in `backend/SPEC.md`.
- CI: GitHub CI runs on `dev` pushes and PRs. Jenkins Validate now matches it (frontend build, backend `verify`) and sets its git identity repo-locally instead of with `git config --global`. Actions are SHA-pinned, and Dependabot opens monthly update PRs against `dev`. Document the real branch flow (`feat/*` → `dev` → `staging`).
- Docs: record the 2026-11-01 staging verification. P7-06 is closed, with the XP/streak UI check moved to Phase 5. P3-06 stays open for the deep-link refresh fix and the focus-file retest.
- Wire the Codebase Explorer into the room: the monitor hotspot opens `/room/codebase` as a wide overlay (nested route), replacing the standalone page.
- Phase 3 Codebase Explorer: add the static `shopfront` synthetic codebase (Users + Products, with an `index.txt` allow-list and a consistency test). Add the read-only `GET /api/codebase/files` and `GET /api/codebase/files/{path}` endpoints, which resolve the codebase from the player's active task and return 404 for any path that isn't in the index.
- Flyway `V7__add_task_codebase_scope.sql`: tasks gain `codebase_key` (default `shopfront`) and `focus_files`. Task responses include `codebaseKey` and `focusFiles`. Three seed tasks now point at real `shopfront` files.
- Fix: JAX-RS exceptions such as 405 Method Not Allowed keep their status code instead of being mapped to 500.
- Frontend: add a shared, lazy-loaded Monaco `CodeEditor` (bundled locally, pinned `@monaco-editor/react` 4.7.0 and `monaco-editor` 0.57.0) and the `/room/codebase` explorer (collapsible `FileTree`, `?file=` deep links). The Task Board links focus files and the explorer, and the room links to the explorer.
- Process: AGENTS.md now requires checking the Trello board before every change. Create or extend cards, avoid duplicates, move cards to `BLOCKED` while a PR waits for review, and to `DONE` once merged.
- Add the Phase 7 game shell (P7-01, P7-02, P7-05): isometric SVG room with an avatar at the desk and keyboard-accessible hotspots (kanban board → Task Board, door → End of Day, monitor disabled until Phase 3), a HUD with XP and streak, Task Board and Profile as overlays on nested `/room` routes (`/profile` redirects to `/room/profile`), the Task Board opening once per session while today's task is `ASSIGNED`, and an End of Day overlay with the task outcome, XP and streak.
- Add XP and streaks (P7-03, P7-04): `xp_event` ledger (Flyway V8), 100 XP awarded once per task when it reaches `APPROVED`, and `GET /api/progress` returning `totalXp`, `xpToday`, `currentStreak`, `longestStreak`, `approvedTodayTaskTitle` (UTC days, streak counted on days with an approved task).
- Add `quarkus-jacoco` (test scope) so `./mvnw verify` writes a coverage report to `backend/target/jacoco-report`.
- Docs: close Phase 0, P1-07 and Phase 2.1 task records to match delivered work. P0-03 (LangChain4j Ollama) is marked deferred. Rewrite the Phase 2.1 smoke criterion to the unauthenticated `401` check.
- Docs: fix stale `.env.example` references (README, staging runbook, observability README), the Java 25 prerequisite, backend env vars, and the frontend/backend SPEC stack tables.
- Docs: add Phase 3 (Codebase Explorer, Monaco `CodeEditor` shared with Phase 4) and Phase 7 (Game Shell) task specs, which can be worked on in parallel. Reserve Flyway versions V7 (P3-03) and V8 (P7-03). Record the decisions: Monaco bundled locally, overlays driven by nested routes, 100 XP plus a 50 XP first-attempt bonus, UTC days, streak counted on approved-task days.
- Docs: link the Figma application design from README and the frontend SPEC.
- Docs: fix drift. README points to the real repo and says backend tests run on H2, north_star closes the state management decision, ROADMAP no longer says task generation calls Ollama, and the staging runbook lists every environment variable and how `.env` reaches the host.

- Allow `PATCH` in backend CORS methods so starting a task (`PATCH /api/tasks/{id}/status`) isn't rejected.
- Add a CORS check to the staging smoke test (POST with the public `Origin` must reach auth) and document the Tailscale staging URL for `CORS_ORIGINS` and Auth0.

- Fix staging `/api` 502s after backend redeploys: nginx now re-resolves `backend` via Docker DNS instead of caching its IP at startup.
- Add `scripts/smoke-staging.sh` post-deploy smoke test (frontend, `/api` proxy, auth) and run it from the Jenkins health check stage.
- Docker: run the backend image as non-root, add nginx security and cache headers, pin PostgreSQL to `16.15`, and remove the unused Quarkus Dockerfiles and native build config. Fix the frontend healthcheck, which could report unhealthy because `localhost` resolved to IPv6 while nginx listens on IPv4 only.

- Add an importable Grafana backend overview dashboard for HTTP traffic, errors, latency, JVM metrics, logs, and traces, with service/environment filters.

- Add local-only LGTM observability, persistent storage, and Quarkus OTLP logs, traces, and metrics; document operation and pending runtime validation.

- Restore `npm ci` before frontend linting in Jenkins so the local `oxlint` binary is installed in clean workspaces.
- Implement Phase 2.1 staging deploy assets for Docker Compose, backend config, frontend static serving, and deploy docs.
- Add Phase 2.1 planning for a minimal Docker Compose staging deploy slice.
- Complete Phase 2 integration verification and document passing backend/frontend checks.
- Show a `Continue` button when today's task is already `IN_PROGRESS`.
- Randomize seed task selection across matching player topics.
