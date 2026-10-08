# HTTPS Plan: Tailscale Staging and Public Production

**Status:** Proposed
**Date:** 2026-10-07

## Goal

Serve the home-lab staging app over HTTPS for Auth0 while keeping it private to the Tailscale tailnet. Document the changes needed when the app becomes a public production service.

## Current State

- Docker Compose publishes the frontend container on host port `5173` using `5173:80`.
- nginx serves the built Vite app and proxies `/api/` to the backend.
- Auth0 settings are baked into the frontend image at build time.
- The app is currently opened with an HTTP URL, which Auth0's browser SDK rejects on a remote host.

## Staging Approach: Tailscale Serve

Use **Tailscale Serve** on the always-on home-lab host. Serve provides HTTPS to devices in the tailnet and keeps the app unavailable to the general internet. Do not use Funnel for normal staging; Funnel makes the service public.

### Steps

1. Give the Tailscale host a stable, non-sensitive machine name. Tailscale HTTPS certificate names are entered in the public Certificate Transparency log.
2. In the Tailscale admin console, enable MagicDNS and HTTPS certificates for the tailnet. Review the certificate-name publication implications before enabling HTTPS.
3. Restrict the Compose frontend port to loopback, changing the mapping to `127.0.0.1:${FRONTEND_PORT:-5173}:80`. This leaves Tailscale Serve as the entry point instead of exposing port `5173` directly on the LAN.
4. On the host, configure Tailscale Serve to proxy its HTTPS endpoint to the local frontend port, for example `tailscale serve 5173`. Follow the CLI's setup prompt if HTTPS is not enabled, and use `tailscale serve --help` for the installed client version's options.
5. Open the HTTPS URL reported by Serve, normally `https://<machine>.<tailnet>.ts.net`. Check the URL from another tailnet device.
6. Update the Auth0 SPA application's Allowed Callback URLs, Allowed Logout URLs, and Allowed Web Origins to use this exact HTTPS origin. The callback URL is `<origin>/callback`.
7. Keep the frontend API base URL empty so browser requests use same-origin `/api` and nginx proxies them to the Compose backend. Set backend CORS to the exact HTTPS frontend origin if the backend's CORS configuration still requires it.
8. Rebuild and deploy the frontend image after changing any `VITE_*` value, since Vite embeds those values into the static bundle during image build.
9. Verify the HTTPS certificate, login redirect and callback, logout, authenticated `GET /api/tasks/today`, and that the frontend is not reachable via the host's LAN address and port `5173`.

### Staging Acceptance Criteria

- The app loads at its Tailscale HTTPS hostname without the Auth0 secure-origin error.
- Auth0 login and callback work from tailnet-connected devices.
- The app remains private to the tailnet; unauthenticated public internet clients cannot access it.
- PostgreSQL and backend ports are not exposed outside the Docker network.
- The Jenkins deploy still rebuilds/restarts the Compose frontend after environment changes.

## Public Production Evolution

Tailscale Serve is tailnet-only. For public production, choose a public hostname such as `app.example.com`, point public DNS to the production ingress, and terminate TLS at a managed load balancer/ingress or a maintained reverse proxy such as Caddy. Tailscale Funnel can expose a home-lab service publicly over HTTPS, but it is a sharing/demo mechanism and should not be the assumed production hosting path.

### Production Changes

1. **Hosting and ingress:** Move the app to a reliable public host or cloud platform. Expose only HTTPS on the ingress; keep PostgreSQL private and the backend private to the Compose/network layer. Do not publish the frontend container port directly to the public interface.
2. **DNS and certificates:** Create DNS records for the production hostname and configure managed TLS or automated certificate issuance and renewal at ingress. Redirect HTTP to HTTPS and enable secure response headers.
3. **Auth0:** Configure production callback (`https://app.example.com/callback`), logout, and web origins. Use a production Auth0 application/tenant configuration separate from staging where practical. Never put a client secret in the SPA.
4. **Frontend API routing:** Prefer same-origin `/api` routing through the production ingress. If frontend and API use separate origins, set the production API base URL and allow only the production frontend origin in backend CORS.
5. **Environment and secrets:** Provide production-only database credentials, Auth0 issuer/audience, allowed origin, and frontend build args through the deployment secret/config store. Do not reuse staging credentials or commit `.env` files. Remember frontend `VITE_*` values are public identifiers, not secrets.
6. **Deployment pipeline:** Add an explicit production environment/approval path, deploy an immutable revision or image tag, and retain a documented rollback target. Do not let the staging branch or staging credentials deploy to production.
7. **Operations:** Add database backup/restore, health checks, centralized logs, monitoring/alerts, resource limits, dependency/image updates, and a tested recovery procedure before accepting real users.
8. **Data and policy:** Review privacy, retention, terms, and incident-response requirements for the intended users and jurisdictions before launch.

### Production Acceptance Criteria

- Public users reach the app only through HTTPS on the production hostname.
- Auth0 login, callback, logout, and API authorization use production values.
- Database and backend are not directly exposed to the public internet.
- Production secrets, backups, monitoring, rollback, and recovery have been verified.
- Staging and production use separate configuration and deployment approvals.

## Decisions and Risks

- **Recommended now:** Tailscale Serve for private home-lab staging. It is a small change and directly supplies a trusted HTTPS origin for Auth0.
- HTTPS enablement publishes the machine and tailnet names in Certificate Transparency. Rename the host first if its current name reveals sensitive information.
- The current Compose port binding listens on all host interfaces. Restrict it to loopback before routing through Serve.
- **Not the production recommendation:** Tailscale Funnel. Funnel is publicly reachable and has service limits; it is useful for temporary public demos, not a substitute for a production hosting and operations design.

## References

- [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve)
- [Tailscale HTTPS certificates](https://tailscale.com/docs/how-to/set-up-https-certificates)
- [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel)
