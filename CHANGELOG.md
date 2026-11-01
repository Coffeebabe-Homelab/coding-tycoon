# Changelog

## Unreleased

- Phase 3 Codebase Explorer: add the static `shopfront` synthetic codebase (Users + Products, with an `index.txt` allow-list and a consistency test). Add the read-only `GET /api/codebase/files` and `GET /api/codebase/files/{path}` endpoints, which resolve the codebase from the player's active task and return 404 for any path that isn't in the index.
- Flyway `V7__add_task_codebase_scope.sql`: tasks gain `codebase_key` (default `shopfront`) and `focus_files`. Task responses include `codebaseKey` and `focusFiles`. Three seed tasks now point at real `shopfront` files.
- Fix: JAX-RS exceptions such as 405 Method Not Allowed keep their status code instead of being mapped to 500.
- Frontend: add a shared, lazy-loaded Monaco `CodeEditor` (bundled locally, pinned `@monaco-editor/react` 4.7.0 and `monaco-editor` 0.57.0) and the `/room/codebase` explorer (collapsible `FileTree`, `?file=` deep links). The Task Board links focus files and the explorer, and the room links to the explorer.

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
