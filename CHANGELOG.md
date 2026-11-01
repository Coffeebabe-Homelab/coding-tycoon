# Changelog

## Unreleased

- Process: AGENTS.md now requires checking the Trello board before every change. Create or extend cards, avoid duplicates, move cards to `BLOCKED` while a PR waits for review, and to `DONE` once merged.

- Docs: close Phase 0, P1-07 and Phase 2.1 task records to match delivered work. P0-03 (LangChain4j Ollama) is marked deferred. Rewrite the Phase 2.1 smoke criterion to the unauthenticated `401` check.
- Docs: fix stale `.env.example` references (README, staging runbook, observability README), the Java 25 prerequisite, backend env vars, and the frontend/backend SPEC stack tables.
- Docs: add Phase 3 (Codebase Explorer, Monaco `CodeEditor` shared with Phase 4) and Phase 7 (Game Shell) task specs, which can be worked on in parallel. Reserve Flyway versions V7 (P3-03) and V8 (P7-03). Record the decisions: Monaco bundled locally, overlays driven by nested routes, 100 XP plus a 50 XP first-attempt bonus, UTC days, streak counted on approved-task days.
- Docs: link the Figma application design from README and the frontend SPEC.

- Allow `PATCH` in backend CORS methods so starting a task (`PATCH /api/tasks/{id}/status`) isn't rejected.
- Add a CORS check to the staging smoke test (POST with the public `Origin` must reach auth) and document the Tailscale staging URL for `CORS_ORIGINS` and Auth0.

- Fix staging `/api` 502s after backend redeploys: nginx now re-resolves `backend` via Docker DNS instead of caching its IP at startup.
- Add `scripts/smoke-staging.sh` post-deploy smoke test (frontend, `/api` proxy, auth) and run it from the Jenkins health check stage.

- Add an importable Grafana backend overview dashboard for HTTP traffic, errors, latency, JVM metrics, logs, and traces, with service/environment filters.

- Add local-only LGTM observability, persistent storage, and Quarkus OTLP logs, traces, and metrics; document operation and pending runtime validation.

- Restore `npm ci` before frontend linting in Jenkins so the local `oxlint` binary is installed in clean workspaces.
- Implement Phase 2.1 staging deploy assets for Docker Compose, backend config, frontend static serving, and deploy docs.
- Add Phase 2.1 planning for a minimal Docker Compose staging deploy slice.
- Complete Phase 2 integration verification and document passing backend/frontend checks.
- Show a `Continue` button when today's task is already `IN_PROGRESS`.
- Randomize seed task selection across matching player topics.
