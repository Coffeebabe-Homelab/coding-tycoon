# PLAN — All-in-one LGTM observability for Quarkus + React/Vite

## Goal
Deploy `grafana/otel-lgtm` on the **same Docker host** as the application, send Quarkus telemetry to it over OTLP, and view logs, traces, and metrics in Grafana. Keep access local initially. Make the deployment easy to replace with separate Grafana/Loki/Tempo/metrics/Collector containers later.

> Scope: homelab/development. The all-in-one image is intended for development, demos, and testing, not production.

## Constraints
- Use Docker Compose and one `grafana/otel-lgtm` container.
- Preserve application behavior and existing Compose layout; inspect the repo before editing.
- Persist telemetry data with a named Docker volume mounted at `/data`.
- Never expose OTLP ingestion or Grafana publicly. Initially bind host ports to `127.0.0.1`.
- Avoid hard-coded credentials in committed files. Use a gitignored `.env` and an `.env.example`.
- Do not add a second collector yet: the image already bundles an OpenTelemetry Collector.
- Avoid introducing a new monitoring platform or application database.

## Phase 1 — Inspect the project
- [x] Find existing Compose files, Quarkus module/build tool and version, frontend deployment configuration, and current Docker networks.
- [x] Check whether the Quarkus version supports OpenTelemetry logs (Quarkus 3.16+); if not, record an upgrade/alternative rather than applying unsupported settings.
- [x] Identify whether Quarkus runs inside Docker or directly on the host and select the correct OTLP URL.
- [x] Check existing ports, volume naming, environment files, and any current OpenTelemetry instrumentation.

## Phase 2 — Add LGTM Compose service
- [x] Add an `observability/compose.yaml` or integrate into the existing Compose file, following the repo's convention.
- [x] Use `grafana/otel-lgtm`, ideally with a tested, pinned image tag or digest rather than an untracked `latest` in the final configuration.
- [x] Publish `127.0.0.1:3000:3000` (Grafana), `127.0.0.1:4317:4317` (OTLP/gRPC) and `127.0.0.1:4318:4318` (OTLP/HTTP), unless a host port is already occupied.
- [x] Add persistent named volume `lgtm-data:/data` and `restart: unless-stopped`.
- [x] Put the LGTM container on a Docker network reachable by Quarkus. If application and LGTM live in separate Compose projects, use an explicit shared external network or another documented approach; **do not use `localhost` from a different container**.
- [x] Configure Grafana admin credentials using environment variables sourced from `.env` (for example `GF_SECURITY_ADMIN_USER` and `GF_SECURITY_ADMIN_PASSWORD`). Document that changing these values after initialization may not reset stored credentials.
- [x] Keep Loki, Tempo, Prometheus and other internal ports unpublished.
- [x] Confirm compose syntax with `docker compose config`.

## Phase 3 — Instrument the Quarkus backend
- [x] Add or verify the `quarkus-opentelemetry` extension.
- [x] Enable OpenTelemetry **traces**, **logs**, and, if supported in the installed version, **metrics**. Check Quarkus documentation for signal-specific exporter properties; do not assume defaults export all three signals.
- [x] Configure a stable `service.name` (for example `quarkus-api`) and `deployment.environment` (`homelab` or `dev`).
- [x] Configure OTLP export to the LGTM Collector:
  - Docker network: `http://lgtm:4318` using OTLP HTTP/protobuf when supported by the installed Quarkus version.
  - Host-run Quarkus: `http://127.0.0.1:4318`.
  - If using Quarkus' default OTLP/gRPC exporter instead, use port `4317` and the matching protocol configuration.
- [x] Make endpoint and service identification configurable through existing environment/config conventions.
- [x] Confirm ordinary Quarkus application logs are exported (not only traces). Avoid logging tokens, passwords, auth headers, or request bodies.
- [x] Preserve stdout logging for straightforward Docker troubleshooting.

## Phase 4 — Frontend scope
- [x] **Do not send browser telemetry directly to the LGTM Collector initially.** Browser-to-Collector export needs explicit CORS, network exposure, privacy, and authentication decisions.
- [x] Keep React/Vite unchanged for the first deployment; Quarkus HTTP request traces still provide backend visibility for frontend-triggered requests.
- [x] Document a later optional phase for browser OpenTelemetry instrumentation and trace-context propagation, routed through a controlled first-party endpoint/proxy rather than exposing unauthenticated OTLP publicly.

## Phase 5 — Validate end-to-end
- [x] Start LGTM via Compose; check its container health/startup logs.
- [ ] Open Grafana locally at `http://127.0.0.1:3000` (or through SSH forwarding: `ssh -L 3000:127.0.0.1:3000 user@homelab-host`).
- [x] Generate one known Quarkus log and one HTTP request.
- [ ] In Grafana Explore, verify the Quarkus service produces searchable **logs in Loki** and **traces in Tempo**.
- [x] Verify **metrics** appear in the bundled metrics backend; if Quarkus metrics are unsupported, explicitly document that limitation instead of declaring success.
- [x] Confirm the service label/environment are distinguishable in queries.
- [x] Restart the LGTM container and confirm stored telemetry survives the restart.
- [x] Confirm Grafana and OTLP ports are not listening on the LAN interface.

## Phase 6 — Deliverables and operating notes
- [ ] Commit Compose configuration, `.env.example`, Quarkus configuration/dependency updates, and a short `observability/README.md`.
- [x] Document start/stop/update commands; Grafana URL; how to find logs/traces/metrics; and basic troubleshooting (`docker compose logs`, connectivity tests).
- [x] Record storage usage expectations and an initial short retention strategy if configurable; otherwise document defaults and a disk-space monitoring/cleanup procedure. Never delete the volume during routine restarts.
- [x] Document the volume backup/restore approach, noting consistency requirements.
- [x] Keep deployment configuration in source control, but keep `.env`, credentials, and telemetry data out of Git.

## Later — LAN access (not part of initial implementation)
- Expose **Grafana UI only**, preferably through the existing reverse proxy with authentication and HTTPS if available.
- Keep OTLP endpoints reachable only by trusted services on Docker networks, not generally from the LAN.
- Use firewall rules and/or a VPN when accessing from other networks.

## Later — Migration to separate containers
- Keep application OTLP configuration pointed at a stable Collector hostname (or a configurable endpoint).
- Replace all-in-one LGTM with a standalone Collector/Alloy + Loki + Tempo + Prometheus (or Mimir) + Grafana.
- Move storage and Grafana configuration deliberately; **do not assume the all-in-one `/data` volume is directly portable** to every new component.
- Migrate one telemetry signal at a time and re-run end-to-end validation.

## Definition of done
1. `docker compose up -d` starts all-in-one LGTM without altering unrelated services.
2. Grafana is accessible locally with non-default credentials and telemetry survives restarts.
3. Quarkus logs and HTTP traces appear in Grafana; metrics are validated or explicitly documented as unavailable.
4. OTLP ingest and Grafana are not publicly exposed.
5. `observability/README.md` explains operation and future LAN/multi-container migration.

## References
- https://grafana.com/docs/opentelemetry/docker-lgtm/
- https://github.com/grafana/docker-otel-lgtm
- https://quarkus.io/guides/opentelemetry/
- https://quarkus.io/guides/opentelemetry-logging/

## Implementation record — 2026-10-31

Source plan was supplied in the primary checkout and copied here for history.
Phases 1–4 are implemented. Phase 6 files are ready for review; no Git commit was requested or made.

Validation:
- Baseline and updated `./mvnw verify`: 30 tests passed, package built. Failsafe integration execution is skipped by the existing POM; no coverage report is configured, so no coverage percentage is claimed.
- `docker compose config --quiet` passed with temporary validation environment values.
- Pinned LGTM 0.39.0 pulled and started; all bundled components reported ready.
- Re-ran all 30 backend tests with the SDK enabled, host OTLP endpoint, environment `observability-validation`, and a 1-second metrics interval: passed. An initial sandbox run failed to bind sockets; the authorized retry outside the sandbox passed.
- Grafana anonymous `/api/user` returned 401; generated non-default credentials authenticated. Credentials are in the gitignored root `.env`, mode 0600. Application settings still need to be supplied from `.env.example`.
- Loki returned ordinary application WARN logs with service/environment identity and trace IDs.
- Tempo returned HTTP server trace `a273d065530eccbff691196824fcea77` (`PATCH /api/tasks/{id}/status`), matching its Loki log. Service-name TraceQL search returned no results during validation; trace-ID lookup works. Recheck search indexing in Grafana before calling Explore service search verified.
- Prometheus returned JVM GC/network and HTTP request-duration series for the Quarkus service; 22 HTTP metric series distinguished by environment were present.
- Logs, matching trace, and metrics remained accessible through authenticated Grafana datasource proxies after `restart` and `up -d --force-recreate lgtm`.
- Compose reports only loopback bindings on 3000, 4317, 4318; internal Loki/Tempo/Prometheus ports are unpublished.

Incomplete/manual:
- Browser login and visual Grafana Explore checks, including Tempo service search.
- Full authenticated application Compose deployment and browser-generated requests: no real Auth0/application credentials supplied. Validation used the existing H2-backed Quarkus HTTP tests against LGTM; other application services were not started or modified.
- Backup/restore is documented, not executed. No coverage claim or additional supported-JDK matrix run.
- Commit/review remains with the owner.
