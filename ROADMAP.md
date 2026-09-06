# 🗺️ Roadmap — Coding Tycoon

> This roadmap covers the MVP delivery. Each phase is a shippable increment — the game is playable (even if incomplete) at the end of every phase.
> Reference: [north_star.md](./north_star.md)

---

## Phase Overview

```
Phase 0 — Foundation          Project setup, tooling, CI skeleton
Phase 1 — Auth & Profile      Login, onboarding, player profile
Phase 2 — Task Engine         AI task generation, Task Board UI
Phase 3 — Codebase Explorer   Synthetic codebase, file tree browser
Phase 4 — Code Editor         Monaco editor, VCS panel, commit/push
Phase 5 — AI Review Engine    Code review, feedback, iteration loop
Phase 6 — Skill Profile       AI-generated strengths/weaknesses, progress view
Phase 7 — Game Shell          Static room scene, session flow, day structure
Phase 8 — MVP Polish          End-to-end flow, 10 tasks seeded, launch-ready
```

---

## Phase 0 — Foundation

**Goal:** Skeleton repos, local dev environment running, CI green on empty project.

### Tasks
- [x] Initialise `frontend/` — Vite + React + TypeScript + Tailwind CSS
- [x] Initialise `backend/` — Quarkus (REST, Panache, Dev Services for PostgreSQL)
- [ ] Add `quarkus-langchain4j-ollama` extension to backend *(deferred — version compatibility regression on Quarkus 3.33+; revisit in Phase 2/3)*
- [x] Docker Compose for local: PostgreSQL + Ollama
- [x] Auth0 tenant setup (dev application, callback URLs)
- [x] Configure Auth0 SDK in frontend (`@auth0/auth0-react`)
- [x] Configure Quarkus OIDC to validate Auth0 JWTs
- [x] Basic CI pipeline (GitHub Actions): lint + build frontend, build backend
- [x] `README.md` with local dev setup instructions
- [x] `docs/DEVELOPMENT_GUIDELINES.md` — architecture decisions, coding patterns, minimum test coverage (unit + integration), documentation standards, Git branching strategy, PR checklist
- [x] `backend/SPEC.md` — backend architecture, module structure, REST API conventions, data model overview, AI integration patterns, error handling, security model, observability
- [x] `frontend/SPEC.md` — frontend architecture, component structure, state management approach, routing, design system usage (Tailwind conventions, component naming), Monaco integration guidelines, accessibility baseline

### Exit Criteria
- `npm run dev` starts the frontend (blank page, no errors)
- `./mvnw quarkus:dev` starts the backend (health endpoint green)
- Auth0 login/logout works end-to-end (token validated by backend)
- CI passes on every push
- `DEVELOPMENT_GUIDELINES.md`, `backend/SPEC.md`, and `frontend/SPEC.md` exist and are reviewed by the team

---

## Phase 1 — Auth & Player Profile

**Goal:** Player can log in, complete onboarding, and have a persisted profile.

### Tasks
- [x] `User` entity, `UserRepository` port/adapter, Flyway `V1__create_user_table.sql` (P1-01)
- [x] `Topic` entity, `PlayerProfile` entity, join table `player_profile_topics`, Flyway migrations V2–V5 including seed data (P1-02)
- [x] `GET /api/topics` — public endpoint returning available topics for the onboarding wizard (P1-03)
- [x] `POST /api/profile` — create profile on first login; also creates `User` record if new; topics referenced by ID (P1-03)
- [x] `GET /api/profile` — retrieve profile with topics resolved to full objects (P1-03)
- [x] `PUT /api/profile` — update seniority and topics (P1-03)
- [x] Auth0 login/logout flow in frontend — extract pages into `pages/`, clean up routing, remove dev token logging (P1-04)
- [x] Onboarding wizard UI: 3-step form; topics loaded from `GET /api/topics`, not hardcoded (P1-05)
- [x] Profile page UI: display onboarding settings; inline edit mode; topics as badge chips (P1-06)
- [x] JWT user identity wired to profile via Auth0 `sub` claim (P1-01, P1-03)
- [x] Integration verification: full new-user and returning-user flows, security checks, coverage thresholds (P1-07)

### Exit Criteria
- New user logs in → onboarding wizard (topics from API) → profile saved
- Returning user logs in → lands on room, profile page shows correct data
- Profile edit saves changes; topics reflect the normalised `topics` table
- Backend rejects unauthenticated requests with 401

---

## Phase 2 — Task Engine

**Goal:** AI generates a daily task appropriate for the player profile; player sees it on the Task Board.

### Tasks
- [x] Design task data model: `Task` entity (title, description, acceptance criteria, difficulty, tags)
- [x] `POST /api/tasks/generate` — calls Ollama to generate a task from player profile
- [x] Ollama prompt template: task-generator (language, framework, seniority, topic → task spec)
- [x] Seed 10 hand-crafted fallback tasks (Java/Junior) — decouples AI from early testing
- [x] `GET /api/tasks/today` — returns today's active task for the player
- [x] Task Board UI — Kanban-inspired: Today's ticket with title, description, acceptance criteria
- [x] Task status state machine: `ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED / CHANGES_REQUESTED`

### Exit Criteria
- Player logs in → Task Board shows a relevant Java/Junior task matched to their selected topics
- Task was either AI-generated or drawn from seed data (seed is always the fallback)
- "Start task" transitions status to `IN_PROGRESS` and persists across page refresh

---

## Phase 3 — Codebase Explorer

**Goal:** Player can browse a synthetic Java codebase to understand the context for their task.

### Tasks
- [ ] Design synthetic codebase structure (a small Java Spring Boot app — Users + Products)
- [ ] `GET /api/codebase/files` — returns file tree for the player's current task
- [ ] `GET /api/codebase/files/{path}` — returns file content (read-only)
- [ ] Codebase scoped per task (task description references specific files)
- [ ] File tree UI component (collapsible, file icons by type)
- [ ] File viewer: syntax-highlighted read-only code (Prism or Monaco read-only mode)
- [ ] Codebase stored as static files in backend resources (MVP — no generation)

### Exit Criteria
- Player can open the file tree and browse the synthetic codebase
- Clicking a file shows syntax-highlighted content
- No ability to edit files in the explorer (read-only enforced)

---

## Phase 4 — Code Editor & VCS Panel

**Goal:** Player writes their implementation in Monaco, then commits and pushes via the virtual VCS.

### Tasks
- [ ] Monaco Editor integration in frontend (target file pre-loaded, editable)
- [ ] `GET /api/submissions/template` — returns the file the player needs to edit (with TODOs)
- [ ] VCS Panel UI: diff view (original vs player's version), commit message field, "Push" button
- [ ] `POST /api/submissions` — saves player's code submission for the active task
- [ ] Submission entity: `taskId`, `userId`, `code`, `commitMessage`, `attemptNumber`, `submittedAt`
- [ ] Transition task status to `SUBMITTED` on push
- [ ] Basic diff computation (backend or frontend)

### Exit Criteria
- Player opens Monaco pre-loaded with the template file
- Player edits, writes a commit message, and clicks Push
- Submission is saved, task status transitions to SUBMITTED
- Diff view shows what changed

---

## Phase 5 — AI Review Engine

**Goal:** After submission, an AI senior dev reviews the code and returns APPROVED or CHANGES REQUESTED with inline feedback.

### Tasks
- [ ] Ollama prompt template: code-reviewer (task spec + codebase context + submission + guidelines → review)
- [ ] `POST /api/reviews/trigger` — triggers async AI review for a submission
- [ ] Review entity: `submissionId`, `verdict` (APPROVED/CHANGES_REQUESTED), `comments` (list of inline feedback), `reviewedAt`
- [ ] Review polling or WebSocket notification to frontend
- [ ] Review Panel UI: verdict banner + inline comments (file + line + message)
- [ ] If CHANGES_REQUESTED: player can edit in Monaco and re-submit (attempt counter increments)
- [ ] If APPROVED: task marked complete, XP awarded
- [ ] Code review guidelines document (used as context in the prompt)

### Exit Criteria
- Submit code → review appears within reasonable time (target < 30s on local Ollama)
- APPROVED path: task closes, player sees success state
- CHANGES REQUESTED path: feedback shown, player can iterate
- Multiple attempts tracked correctly

---

## Phase 6 — Developer Skill Profile

**Goal:** After each review cycle completes, AI extracts strengths and weak points; player can see their progress.

### Tasks
- [ ] Ollama prompt template: skill-profiler (review history → strengths, weak points, improvement signals)
- [ ] `POST /api/profile/skill-analysis` — triggers async skill profile update after task approval
- [ ] `SkillProfile` entity: `userId`, `strengths` (list), `weakPoints` (list), `improvementSignals` (list)
- [ ] `ReviewHistory` entity: per-task summary (task name, verdict, attempt count, top feedback tags)
- [ ] `GET /api/profile/skill` — returns current skill profile
- [ ] Profile / Progress screen UI:
  - Strengths as tag badges
  - Weak points as "focus areas"
  - Improvement signals as "levelled up" callouts
  - Review history timeline
- [ ] Feed Skill Profile into task-generator and reviewer prompts

### Exit Criteria
- Complete a task → skill profile updates
- Profile screen shows strengths and weak points derived from review history
- Second task's AI review references the player's known weak points

---

## Phase 7 — Game Shell

**Goal:** The game has a coherent visual shell — the desk room, session flow, and day structure feel like a game, not a CRUD app.

### Tasks
- [ ] Static isometric room scene (CSS/SVG — no pixel art engine for MVP)
- [ ] Basic avatar placeholder at the desk
- [ ] Session flow: Login → Room → Task Board opens → work → Review → End of Day screen
- [ ] "End of Day" summary screen: task result, XP gained, streak, skill profile delta
- [ ] XP system: points per approved task, bonus for first-attempt approval
- [ ] Streak tracker (daily login + task completion)
- [ ] Navigation: room as hub, panels open as overlays
- [ ] Responsive layout (desktop-first, minimum 1280px width)

### Exit Criteria
- The full loop feels cohesive: login → room → task → code → review → end of day
- XP and streak are visible and update correctly
- No raw CRUD-app feel — the UI reads as a game

---

## Phase 8 — MVP Polish & Launch Readiness

**Goal:** The game is end-to-end playable with 10 seeded tasks, stable, and ready for first users.

### Tasks
- [ ] Seed all 10 Java/Junior tasks with synthetic codebases (hand-crafted, reviewed for quality)
- [ ] Tune AI prompts: review quality testing across all 10 tasks
- [ ] Error handling: graceful degradation if Ollama is slow / unreachable
- [ ] Loading states throughout (review is async — spinner / progress indicator)
- [ ] Mobile warning screen ("best on desktop")
- [ ] Basic observability: structured logging (Quarkus), frontend error boundary
- [ ] End-to-end smoke test: new user → complete 1 task → skill profile updated
- [ ] User acceptance testing (play through all 10 tasks)
- [ ] Deploy to a staging environment (docker-compose on a VPS or local demo)

### Exit Criteria
- A new user can complete the full loop unassisted for all 10 tasks
- AI review quality rated as "useful" by at least 3 external testers
- No critical bugs in the happy path

---

## 🚀 Post-MVP Backlog (not scheduled)

| Feature | Notes |
|---|---|
| Dynamic AI task generation (beyond 10 seeds) | Requires prompt calibration + eval harness |
| Evolving codebase across tasks | Tasks build on each other's output |
| Mid / Senior seniority levels | Requires harder task corpus |
| Multi-language support | Python, JavaScript, Go |
| Soft skills tasks | Standups, estimation, PR descriptions |
| Animated pixel-art room | Tiled + PixiJS or custom sprite system |
| Avatar customisation | Unlockable items as XP rewards |
| Multiplayer / team reviews | Review code from other players |
| Production deployment | Cloud infra, CDN, managed DB |
| Mobile support | Responsive game layout |
| **Code review discussion** | New AI flow: player can ask follow-up questions on review comments — "why is this wrong?", "show me a better way" — conversational learning on top of the review |
| **Senior consulting** | New AI flow: before or during coding, player can ask the AI senior for task clarification, hints, or design advice without revealing the solution directly |
| **Open-source projects as codebases** | Real GitHub repos as the synthetic codebase — player works on actual open-source issues, massively increases realism and value |
| **Chargeable plans** | Tiered pricing: free tier (limited tasks/day, base Ollama model), paid tiers (more tasks, better AI model, advanced review depth, review discussions, senior consulting) |
| **AI model vendor upgrade** | Migrate from local Ollama to a cloud provider (OpenAI / Anthropic / Mistral) for better review quality — gated behind paid plans or a global upgrade decision |

---

## 📐 Phase Dependencies

```
Phase 0 (Foundation)
  └─▶ Phase 1 (Auth & Profile)
        └─▶ Phase 2 (Task Engine)
              ├─▶ Phase 3 (Codebase Explorer)
              │     └─▶ Phase 4 (Code Editor & VCS)
              │           └─▶ Phase 5 (AI Review Engine)
              │                 └─▶ Phase 6 (Skill Profile)
              └─▶ Phase 7 (Game Shell) ← can run in parallel with Phase 3–6
Phase 8 (Polish) ← starts after all phases complete
```

---

*Last updated: 2026-09-06 | Status: Phase 2 complete — moving to Phase 3*
