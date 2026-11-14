# P1-08 — Store the user's email from an Auth0 claim

**Phase:** 1 — Auth & Player Profile (fix)
**Status:** ✅ Complete (2026-11-14)
**Depends on:** P1-03

---

## Goal

`users.email` is always empty. `ProfileResource` reads the `email` claim from the
**access token**, but Auth0 puts `email` only in the ID token. The backend must
read the email from a custom claim that an Auth0 Action adds to the access token.

## Decisions

- Claim name: `https://codingtycoon.dev/email`. Auth0 recommends namespaced names
  for custom claims. The name is a contract with the Action, not per-environment
  config, so it is a constant in the backend.
- The email is still optional. Without the Action the claim is missing and the
  column stays `null`, as before.
- Only new users get the email (set when the profile is created). There is no
  production data yet, and staging is reset, so no backfill is needed.

## Steps

- [x] Test: `POST /api/profile` with the namespaced claim stores the email (red)
- [x] Read the namespaced claim in `ProfileResource` (green)
- [x] Resource tests send the namespaced claim, not the plain `email` claim that
      hid the bug
- [x] Document the Auth0 Action in `docs/STAGING_DEPLOY.md` and update
      `backend/SPEC.md` and `CHANGELOG.md`

## Auth0 Action (set up by the owner in each tenant)

Actions › Library › Create Action › Login / Post Login, then add it to the
Login flow:

```js
exports.onExecutePostLogin = async (event, api) => {
  if (event.user.email) {
    api.accessToken.setCustomClaim('https://codingtycoon.dev/email', event.user.email);
  }
};
```

## Done when

- A new user on staging has their email in `users.email` after onboarding.
- `./mvnw verify` passes with coverage at least 80%.

## Result

Merged in PR #52. The owner added the Post-Login Action, reset staging and onboarded again on 2026-11-14: the email is stored on registration.
