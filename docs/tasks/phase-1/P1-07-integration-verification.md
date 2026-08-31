# P1-07 — Phase 1 Integration Verification

**Phase:** 1 — Auth & Player Profile  
**Status:** 🔲 Not started  
**Depends on:** P1-01 through P1-06 all complete  

---

## Goal

Verify the full Phase 1 loop end-to-end before closing the phase and opening a PR to main. This is not a coding task — it's a checklist to walk through manually and a prompt to fix anything that's broken before Phase 2 begins.

---

## Exit Criteria (from ROADMAP)

Walk through each scenario manually with a real browser and a real Auth0 account:

### New user flow
- [ ] Visit `http://localhost:5173` — redirected to `/login`
- [ ] Click "Log in" — redirected to Auth0 Universal Login
- [ ] Complete login — redirected back to `/callback`, then to `/onboarding`
- [ ] Complete the wizard (select topics, click Finish)
- [ ] `POST /api/profile` succeeds (check browser network tab — `201 Created`)
- [ ] Redirected to `/room`, welcome message visible

### Returning user flow
- [ ] Log out, log back in
- [ ] Redirected directly to `/room` (no onboarding wizard shown)
- [ ] Navigate to `/profile` — profile data loads correctly (the settings saved earlier)

### Profile edit flow
- [ ] On `/profile`, click "Edit"
- [ ] Change topics, click Save
- [ ] `PUT /api/profile` succeeds (`200 OK`)
- [ ] Updated topics shown immediately without page refresh

### Security checks
- [ ] Open a new incognito window, visit `http://localhost:5173/room` — redirected to Auth0 login
- [ ] Open `http://localhost:5173/profile` in incognito — redirected to Auth0 login
- [ ] Call `GET http://localhost:8080/api/profile` without a token (curl or Postman) — `401 Unauthorized`
- [ ] Call `POST http://localhost:8080/api/profile` without a token — `401 Unauthorized`

### Backend unit/integration tests
- [ ] `./mvnw verify` passes with zero failures
- [ ] Coverage report shows ≥ 80% line coverage on `ProfileService` and `UserService`

### Frontend checks
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run build` completes with no TypeScript errors

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
