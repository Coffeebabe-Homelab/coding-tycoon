# Staging Deploy

Phase 2.1 deploys the Phase 2 application with Docker Compose: frontend, backend, and PostgreSQL. Ollama is not required for staging because task generation currently falls back to seed data.

## Host Requirements

- Docker Engine with Docker Compose v2
- SSH access from Jenkins using the `staging-ssh-key` credential
- Git checkout access using the `git-checkout-key` credential
- Jenkins deploy target configured with the `staging-deploy` SSH alias
- Deploy directory matching the Jenkinsfile `DEPLOY_PATH`

## Environment File

Jenkins writes `.env` on every deploy from the secret-file credential `coding-tycoon-env-file` (stage *Prepare environment file*). It is then rsynced to `DEPLOY_PATH`. To change a value, update that credential and redeploy. There is no committed example file; never commit `.env`.

Required values:

| Variable | Purpose |
|---|---|
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `AUTH0_DOMAIN` | Auth0 tenant domain for backend JWT validation |
| `AUTH0_AUDIENCE` | Auth0 API identifier |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins; must include the public URL (`https://coding-tycoon-stg.tail028aa9.ts.net`) or every POST/PUT/PATCH returns 403 |
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain baked into the frontend build |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA client ID |
| `VITE_AUTH0_AUDIENCE` | Auth0 API identifier baked into the frontend build |
| `VITE_API_BASE_URL` | Public backend API base URL used by the browser (empty means same origin, through the nginx `/api` proxy) |
| `GF_SECURITY_ADMIN_USER` | Grafana admin user for the `lgtm` service |
| `GF_SECURITY_ADMIN_PASSWORD` | Grafana admin password for the `lgtm` service |

Optional: `DB_NAME` (default `codingtycoon`), `FRONTEND_PORT` (default `5173`), `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://lgtm:4318`), `OTEL_SERVICE_NAME` (default `coding-tycoon-backend`), `DEPLOYMENT_ENVIRONMENT` (default `homelab`), and the `GRAFANA_PORT` (default `3000`), `OTLP_GRPC_PORT` (default `4317`) and `OTLP_HTTP_PORT` (default `4318`) bindings. See [observability/README.md](../observability/README.md).

Don't set these in `.env`:

- `DATABASE_JDBC_URL` and `QUARKUS_PROFILE`: Compose sets them for the backend.
- `LOG_LEVEL`: the backend reads it (default `INFO`), but Compose doesn't pass it to the container, so a value in `.env` has no effect.

## Auth0 Staging URLs

Staging is served over Tailscale at `https://coding-tycoon-stg.tail028aa9.ts.net`. Configure the Auth0 SPA application with:

- Allowed Callback URLs: `https://coding-tycoon-stg.tail028aa9.ts.net/callback`
- Allowed Logout URLs: `https://coding-tycoon-stg.tail028aa9.ts.net`
- Allowed Web Origins: `https://coding-tycoon-stg.tail028aa9.ts.net`

If staging uses a port during early setup, add that exact origin too, for example `http://staging-host:8080`.

### Email claim Action

Auth0 puts the user's email only in the ID token, so the backend can't read it from the access token. Add a Post-Login Action that copies it into the access token, or `users.email` stays empty. Do this once per tenant: Actions › Library › Create Action (Login / Post Login), deploy it, then add it to the Login flow.

```js
exports.onExecutePostLogin = async (event, api) => {
  if (event.user.email) {
    api.accessToken.setCustomClaim('https://codingtycoon.dev/email', event.user.email);
  }
};
```

The email is stored when the player finishes onboarding. Players who onboarded before the Action existed keep an empty email.

## Jenkins Assumptions

The Jenkinsfile validates `dev` (the same checks as GitHub CI), waits for manual approval, merges `dev` into `staging`, builds the root Compose project, rsyncs the repo to the staging host, and runs the command below. With the `DEPLOY_ONLY` parameter it skips validation, approval and merge, and deploys `staging` as-is.

```bash
docker compose -f docker-compose.yml up -d --build --remove-orphans
```

The Jenkins rsync excludes `.git` only, so each deploy also copies `.env` to `DEPLOY_PATH`. A manual deploy reuses the `.env` already there, so create one first if the deploy directory is new.

## Manual Deploy

```bash
git checkout staging
git pull
docker compose build
docker compose up -d --remove-orphans
```

## Smoke Checks

Jenkins runs this after every deploy; run it manually from the deploy path:

```bash
docker compose ps
sh scripts/smoke-staging.sh
```

It checks backend readiness, then goes through the frontend nginx proxy:
`/` → 200, `/api/topics` → 200 (proxy reaches backend, path intact),
`/api/tasks/today` without a token → 401 (backend answered, auth enforced).
When `PUBLIC_ORIGIN` is set (Jenkins sets it), `POST /api/profile` with that
`Origin` → 401 (CORS accepts the public URL; 403 means fix `CORS_ORIGINS`).
A 502 here usually means nginx cannot reach the backend container.

Manual authenticated check:

1. Open the staging frontend.
2. Log in through Auth0.
3. Complete onboarding if needed.
4. Open the task board.
5. Start today's task and refresh the page.
6. Confirm the task still shows `Continue`.

## Rollback

```bash
git fetch origin
git checkout <known-good-sha>
docker compose up -d --build --remove-orphans
```

Database volumes are preserved by default. Use volume deletion only for intentional data resets.
