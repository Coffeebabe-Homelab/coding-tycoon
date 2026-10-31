# Local observability

Quarkus sends logs, HTTP traces, and metrics to the bundled LGTM Collector using OTLP HTTP/protobuf. React/Vite is unchanged. The service shares the application's existing Compose default network; no additional collector or database is needed. This deployment is for development/homelab use.

## Run

From the repository root, copy `.env.example` to `.env` and supply the existing application values plus a non-default `GF_SECURITY_ADMIN_USER` and strong `GF_SECURITY_ADMIN_PASSWORD`. `.env` is ignored by Git. Grafana anonymous access is disabled. Credentials initialize a new volume; changing environment values later does not reset an existing account.

```sh
docker compose config --quiet
docker compose up -d --build
# Start/stop only observability:
docker compose up -d lgtm
docker compose stop lgtm
docker compose restart lgtm
docker compose logs --tail=100 lgtm backend
```

Open http://127.0.0.1:3000 and sign in. For a remote host, use `ssh -L 3000:127.0.0.1:3000 user@homelab-host`. Grafana and OTLP ports bind only to loopback; internal backend ports are unpublished. Override `GRAFANA_PORT`, `OTLP_GRPC_PORT`, or `OTLP_HTTP_PORT` if occupied. Container-to-container traffic still uses `lgtm:4318` regardless of host port overrides.

The backend uses `OTEL_SERVICE_NAME=coding-tycoon-backend` and `DEPLOYMENT_ENVIRONMENT=homelab` in Compose. For host-run Quarkus, unset the Compose `OTEL_EXPORTER_OTLP_ENDPOINT` value or set it to `http://127.0.0.1:4318`; set `DEPLOYMENT_ENVIRONMENT=dev`. Application properties default to that host endpoint. Signals are enabled at build time; rebuild the backend image after changing those settings. Stdout logs remain available. The test profile disables the SDK unless explicitly overridden.

## Verify

Start LGTM, then the backend. Its startup INFO log supplies a known log. Load the task board or request a public API through the frontend proxy, for example:

```sh
curl -fsS http://127.0.0.1:5173/api/topics
docker compose logs --tail=100 backend lgtm
docker compose port lgtm 3000
docker compose port lgtm 4317
docker compose port lgtm 4318
```

Allow at least 60 seconds for metrics export. In Grafana Explore, select the provisioned datasource for each signal:

- Loki: `{service_name="coding-tycoon-backend"}`. Find the startup log and inspect `deployment_environment` resource metadata.
- Tempo: `{ resource.service.name = "coding-tycoon-backend" }`. Find the HTTP request span and inspect `deployment.environment`. If search has not indexed recent data, use the `trace_id` from Loki in Tempo’s trace-ID lookup. Validation confirmed trace-ID retrieval; service search still needs a manual recheck.
- Prometheus: `target_info{service_name="coding-tycoon-backend"}` for resource identity, then use the metric browser to find JVM/runtime or HTTP measurements emitted by Quarkus. Do not count the collector's own metrics as application telemetry.

Record a log timestamp and trace ID, restart LGTM, and query the same time range and ID again. Recreate only LGTM with `docker compose up -d --force-recreate lgtm` and repeat to verify volume persistence independently of the container filesystem. Confirm each port command reports `127.0.0.1`; inspect host listeners if needed (`lsof -nP -iTCP:3000 -sTCP:LISTEN`, similarly for 4317/4318).

If data is absent, inspect backend exporter errors and LGTM startup logs. `docker compose exec backend wget -S -O- http://lgtm:4318/` checks DNS/TCP reachability; a 404 at `/` is expected, while connection refusal is not. Check endpoint/protocol pairing, time range, service name, and build-time signal flags. Never log credentials, auth headers, tokens, request bodies, or user submissions to diagnose ingestion.

## Storage and updates

`lgtm-data` mounts `/data`; Compose prefixes the physical volume name with its project name. Keep that project name stable. Routine stops, restarts and `down` preserve it; never use `down -v` for routine operation.

This configuration retains the pinned image's upstream retention defaults; it does not impose a uniform retention limit across signals. Check the bundled Loki, Tempo, and Prometheus configuration before long-running use. Begin with a short development observation window, check `docker system df -v` and host free space daily, and stop ingestion if growth threatens the host. Usage depends on request volume, log verbosity and label cardinality. To discard old development telemetry, first back it up, stop LGTM, then deliberately remove only its volume and recreate LGTM; all stored telemetry and Grafana accounts/settings will be lost. Do not remove PostgreSQL volumes.

Before upgrading the pinned `grafana/otel-lgtm:0.39.0` image, stop LGTM and back up the entire named volume with a read-only helper-container mount to a host archive. Keep the service stopped throughout the snapshot for consistent Grafana SQLite and telemetry files. Restore into an empty LGTM volume with LGTM stopped, preserving file ownership, then start the same image version and verify all three signals. Backups contain telemetry and account data: keep them outside Git and protect access. Update the image tag in Compose, pull it, recreate only LGTM, and rerun the checks above. Preserve the old image reference and backup for rollback.

## Later

Browser OpenTelemetry and trace-context propagation require privacy, CORS, authentication and sampling decisions; route them through a controlled first-party endpoint/proxy. Do not export directly from the browser to public OTLP. For LAN access, expose only Grafana through authenticated HTTPS or a VPN; retain private ingestion.

For separate containers, point the configurable OTLP endpoint at a stable Collector/Alloy address, then migrate Loki, Tempo, metrics, and Grafana one signal at a time. The all-in-one `/data` layout is not automatically portable.

References: [Quarkus OpenTelemetry](https://quarkus.io/guides/opentelemetry/), [logging](https://quarkus.io/guides/opentelemetry-logging/), [LGTM](https://grafana.com/docs/opentelemetry/docker-lgtm/), [pinned release](https://github.com/grafana/docker-otel-lgtm/releases/tag/v0.39.0).

Validation results and pending checks are recorded in [the implementation plan](../docs/tasks/observability/PLAN-lgtm.md). The local validation instance uses generated credentials saved in the ignored root `.env`; preserve those credentials for its existing volume. Add real application settings before starting the full stack.
