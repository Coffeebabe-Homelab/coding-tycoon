# P0-05 — Auth0 Tenant Setup

**Phase:** 0 — Foundation  
**Status:** ✅ Complete  
**Depends on:** —  

---

## Goal

Create and configure the Auth0 dev tenant and application so the frontend can authenticate users and the backend can validate JWTs.

---

## Acceptance Criteria

- [x] Auth0 tenant created (dev environment)
- [x] Single Page Application (SPA) created in Auth0 for the frontend
- [x] Allowed Callback URLs set: `http://localhost:5173/callback`
- [x] Allowed Logout URLs set: `http://localhost:5173`
- [x] Allowed Web Origins set: `http://localhost:5173`
- [x] Auth0 API (Resource Server) created for the backend with identifier `https://api.codingtycoon.dev`
- [x] Auth0 domain, client ID, and API audience documented in `.env.example` (never committed)
- [ ] Machine-to-machine (M2M) or test user created for automated testing

---

## Implementation Notes

### Auth0 Dashboard Steps

1. **Create tenant** — `codingtycoon-dev` (or your preferred name)
2. **Applications → Create Application** → Single Page Application → React
3. Set callback/logout/origins as per acceptance criteria
4. **APIs → Create API**:
   - Name: `Coding Tycoon Backend`
   - Identifier: `https://api.codingtycoon.dev`
   - Signing algorithm: RS256

### Environment Variables

```bash
# frontend/.env.local (gitignored)
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.codingtycoon.dev
VITE_API_BASE_URL=http://localhost:8080

# .env.example (committed, no real values)
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
VITE_AUTH0_AUDIENCE=
VITE_API_BASE_URL=
```

### Gitignore

Ensure `.env.local` and `.env` are in `.gitignore` — **never commit real credentials**.

---

## Notes

- Auth0 free tier supports up to 7,500 monthly active users — sufficient for MVP.
- `sub` claim from the JWT will be used as the canonical user identifier in the backend.
- PKCE flow is used automatically by `@auth0/auth0-react` — no client secret needed for SPAs.

---

## Definition of Done

- Auth0 tenant and application exist, callback URLs configured, API resource server defined, env vars documented in `.env.example`.

---

## Closure Note (2026-11-01)

`.env.example` was later removed; Auth0 values are documented in `README.md` and `docs/STAGING_DEPLOY.md`. The M2M/test-user item can't be verified from the repo; confirm it in the Auth0 dashboard.
