# LGTM-01 — Importable backend overview

Request: provide a Grafana JSON dashboard as a starting point for staging.

- [x] Add a portable dashboard with selectable Prometheus, Loki, and Tempo sources.
- [x] Include HTTP traffic/errors/latency, JVM memory/GC, logs, and traces.
- [x] Add service/environment filters, including the existing `homelab` default.
- [x] Document import, metric assumptions, and missing-data behavior.
- [x] Run the backend baseline: `./mvnw verify -q`, 30 tests passed.
- [x] Validate JSON structure, source references, panel IDs, and layout.
- [ ] Import in staging and verify panels against actual exported metric names.

No application behavior, deployment configuration, or alerting changes.
No staging connection was used. Live import/rendering and query execution are
pending; metric names follow the Quarkus OpenTelemetry conventions and the
standard Prometheus translation, rather than a live staging inventory.

References: [Quarkus metrics](https://quarkus.io/guides/opentelemetry-metrics/),
[Grafana import](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/import-dashboards/).
