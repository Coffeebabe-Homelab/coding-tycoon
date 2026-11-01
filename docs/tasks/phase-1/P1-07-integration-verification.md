# P1-07 — Phase 1 Integration Verification

**Phase:** 1 — Auth & Player Profile  
**Status:** ✅ Complete  
**Depends on:** P1-01 through P1-06 all complete  

---

## Goal

Verify the full Phase 1 loop end-to-end before closing the phase and opening a PR to main. This is not a coding task — it's a checklist to walk through manually and a prompt to fix anything that's broken before Phase 2 begins.

---

## Exit Criteria (from ROADMAP)

Walk through each scenario manually with a real browser and a real Auth0 account:

### New user flow
- [x] Visit `http://localhost:5173` — redirected to `/login`
- [x] Click "Log in" — redirected to Auth0 Universal Login
- [x] Complete login — redirected back to `/callback`, then to `/onboarding`
- [x] Complete the wizard (select topics, click Finish)
- [x] `POST /api/profile` succeeds (check browser network tab — `201 Created`)
- [x] Redirected to `/room`, welcome message visible

### Returning user flow
- [x] Log out, log back in
- [x] Redirected directly to `/room` (no onboarding wizard shown)
- [x] Navigate to `/profile` — profile data loads correctly (the settings saved earlier)

### Profile edit flow
- [x] On `/profile`, click "Edit"
- [x] Change topics, click Save
- [x] `PUT /api/profile` succeeds (`200 OK`)
- [x] Updated topics shown immediately without page refresh

### Security checks
- [x] Open a new incognito window, visit `http://localhost:5173/room` — redirected to Auth0 login
- [x] Open `http://localhost:5173/profile` in incognito — redirected to Auth0 login
- [x] Call `GET http://localhost:8080/api/profile` without a token (curl or Postman) — `401 Unauthorized`
- [x] Call `POST http://localhost:8080/api/profile` without a token — `401 Unauthorized`

### Backend unit/integration tests
- [x] `./mvnw verify` passes with zero failures
- [x] Coverage report shows ≥ 80% line coverage on `ProfileService` and `UserService`

### Frontend checks
- [x] `npm run lint` passes with zero errors
- [x] `npm run build` completes with no TypeScript errors

---

## Things to watch for

- **Topics not saving correctly:** check that the `topics` array is being serialised/deserialised correctly between frontend and backend (JSON array → `TEXT[]` column)
- **Onboarding shown to returning users:** the check for existing profile must happen before rendering the wizard, not after
- **CORS errors:** if the backend rejects the frontend's requests, check `application.properties` CORS config includes `http://localhost:5173`
- **Auth0 audience mismatch:** `frontend/.env.local` `VITE_AUTH0_AUDIENCE` must match `AUTH0_AUDIENCE` in the backend environment

---

## On completion

- Update ROADMAP.md: tick all Phase 1 tasks
- Create a PR from the feature branch to `main`
- PR description should summarise: what was built, what was tested, any known issues

---

## Definition of Done

- All exit criteria above pass. No known bugs in the Phase 1 happy path. PR opened.

---

## Closure Note (2026-11-01)

Closed retroactively. Phase 2 was built and verified on top of this loop (P2-06), and the same flows run on staging (Phase 2.1). ROADMAP had already marked Phase 1 complete.
