# 🌟 North Star — Coding Tycoon

> A browser-based game that teaches real coding skills — both technical and soft — through a simulated developer workday.
> Inspired by **Game Dev Tycoon** (simulation loop, player progression) and **LeetCode** (code challenges, feedback).

---

## 🎯 Vision

A developer sits down at their virtual desk every day. Their manager drops a ticket. They explore the codebase, write the fix, push it, and wait for the senior dev's review. If it passes, it ships. If not, they iterate. Fifteen minutes a day. Real skills. Real workflows. Real satisfaction.

The key differentiator: **the feedback loop**. Unlike LeetCode (solve and move on) or courses (watch and forget), Coding Tycoon simulates the full professional cycle — task → code → review → iterate — within an engaging, gamified environment.

---

## 🕹️ Core Gameplay Loop

```
Login
  └─▶ Daily Standup: new task appears in the Task Board (JIRA/Trello-inspired)
        └─▶ Explore the virtual Codebase to understand context
              └─▶ Write the implementation in the Monaco Editor
                    └─▶ Commit & Push to the virtual VCS (Git-inspired)
                          └─▶ AI Senior Dev reviews the code
                                ├─▶ APPROVED → feature ships, XP gained, day ends
                                └─▶ CHANGES REQUESTED → feedback shown, iterate
```

**Session length:** ~15–30 minutes (1 in-game "workday")
**Goal:** complete 1 task per session. Encourages daily learning habits.

---

## 👤 Player Profile & Personalisation

### Onboarding (player-defined, editable)

At onboarding, the player sets:

| Field | Options (MVP) |
|-------|---------------|
| **Language** | Java (MVP only) |
| **Framework** | Spring Boot (MVP only) |
| **Seniority** | Junior (MVP only) |
| **Topics** | Seeded list: REST APIs, CRUD, OOP, Clean Code, Git Workflow — player selects any combination |

Topics are stored in a normalised `topics` table (not as free-text strings). The onboarding wizard and profile edit page load the available topics from `GET /api/topics`, so the list is driven from the database rather than hardcoded in the frontend. This enables future analytics (most-selected topics across players) and makes adding new topics a data change, not a code change.

The AI task generator uses this profile to create contextually appropriate daily tasks. A Junior Java developer who selected REST APIs and CRUD might get: *"Implement a REST controller for the Users resource."*

---

### Developer Skill Profile (AI-generated, read-only)

After every completed review cycle, the AI updates a **persistent skill profile** for the player. This profile is:

- **Read-only from the player's perspective** — they can see it, not edit it. It's earned, not declared.
- **Fed back into every future AI interaction** — task generator, codebase generator, and reviewer all receive it as context.
- **Accumulated across sessions** — it grows richer over time, not reset each day.

#### Profile Structure

```
Developer Skill Profile
├── Key Strengths        ← consistent patterns the AI praises across reviews
├── Weak Points          ← recurring issues flagged across reviews
├── Improvement Signals  ← weak points from previous sessions that are now improving
└── Review History       ← per-task summary: task name, verdict, top feedback points
```

#### Example

```
Key Strengths:
  - Consistent naming conventions (camelCase, descriptive variable names)
  - Correct use of HTTP status codes in REST controllers
  - Writes focused, single-responsibility methods

Weak Points:
  - Missing input validation on request bodies (@Valid / @NotNull)
  - Rarely writes Javadoc on public methods
  - Exception handling is generic (catches Exception instead of specific types)

Improvement Signals:
  - Input validation: flagged in tasks 1–3, addressed correctly in tasks 4–5 ✅

Review History:
  - Task 1 "User REST Controller" → APPROVED (3rd attempt) — main issue: missing @Valid
  - Task 2 "Product CRUD Service" → APPROVED (2nd attempt) — main issue: broad catch block
```

#### How it feeds the AI loop

| AI Component | How it uses the Skill Profile |
|---|---|
| **Task Generator** | Increases challenge in weak areas; reinforces strengths with harder variants |
| **Reviewer** | Prioritises known weak points in feedback; notices and calls out improvement signals |
| **Feedback Engine** | Personalises tone — doesn't repeat advice the player has already mastered |

#### Player-facing view (Profile screen)

The player sees this as a clean **progress dashboard**, not raw AI output:
- Strengths displayed as unlocked badges / tags
- Weak points shown as "focus areas" with a progress bar per area
- Improvement signals shown as "levelled up" moments — positive reinforcement
- Review history as a scrollable timeline

---

## 🗺️ World & Aesthetic

- **Setting:** An isometric pixel-art developer room (inspired by the reference image — RGB-lit desk, dual monitors, cosy bedroom-office).
- **Player:** Customisable pixel-art avatar sitting at the desk.
- **Environment:** The room evolves as the player progresses (new monitors, plants, swag) — tycoon-style progression feedback.
- **UI panels** appear as overlays on the room: Task Board, Code Editor, VCS panel, Review window.

---

## 🏗️ Architecture

### Frontend
| Concern | Choice |
|---------|--------|
| Framework | React + TypeScript |
| Code editor | Monaco Editor (VS Code engine) |
| Styling | Tailwind CSS — utility-first, AI-friendly, zero custom CSS overhead |
| State management | Zustand or Redux Toolkit (TBD) |
| Build tool | Vite |

### Backend
| Concern | Choice |
|---------|--------|
| Runtime | Java 25 + Quarkus |
| API style | REST (JAX-RS) |
| Database | PostgreSQL (via Panache ORM) |
| Auth | Auth0 (managed, zero-infra for MVP — revisit for production) |

### AI Tooling (core differentiator)
| Concern | Responsibility |
|---------|---------------|
| Task Generator | Creates daily tasks matching player profile, seniority, and Skill Profile (targets weak points) |
| Codebase Generator | Generates a synthetic project for the player to work inside |
| Code Reviewer | Reviews player submission against task requirements, code guidelines, and existing codebase patterns |
| Feedback Engine | Produces specific, actionable review comments; personalised using the player's Skill Profile |
| Skill Profiler | After each review, extracts strengths, weak points, and improvement signals; persists to the read-only Developer Skill Profile |

AI provider: **Local Ollama** (MVP — self-hosted, zero API cost, via Quarkus Langchain4j Ollama extension; revisit for production scale)  
AI model: **DeepSeek-Coder 6.7B Q4_K_M** (`deepseek-coder:6.7b-instruct-q4_K_M`)

---

## 📋 Game Screens / Panels (MVP)

1. **Login / Onboarding** — player profile setup (language, seniority, topics)
2. **Main Room** — isometric desk scene, entry point for each session
3. **Task Board** — Kanban-style board showing today's ticket (title, description, acceptance criteria)
4. **Codebase Explorer** — file tree of the synthetic project; read-only browsing to understand context
5. **Monaco Editor** — the player writes their implementation here
6. **VCS Panel** — diff view, commit message, "Push" button
7. **Review Panel** — AI senior dev's inline comments + APPROVED / CHANGES REQUESTED verdict
8. **Profile / Progress** — XP, streak, completed tasks, unlocked room items

---

## 🗓️ MVP Scope

**Goal:** validate the core loop with the smallest possible slice.

| Included in MVP | Excluded (future) |
|---|---|
| 1 language: Java | Multi-language support |
| 1 seniority: Junior | Mid / Senior levels |
| ~10 pre-generated tasks | Dynamic AI task generation |
| Static synthetic codebase (per task, no evolution) | Evolving codebase across tasks |
| AI code review — local Ollama | Pair programming mode |
| Monaco editor | Soft skills tasks (standups, estimation, PR descriptions) |
| Developer Skill Profile (strengths, weak points, improvement signals) | Full room customisation / tycoon progression |
| Auth0 authentication | Multiplayer / team review mode |
| Static room scene (no pixel art animation) | Animated pixel-art room |
| Basic avatar (no customisation) | Avatar customisation |
| Local/dev PostgreSQL | Production infra |

---

## 📏 Success Metrics (MVP)

- Player completes at least 3 sessions in a week → habit forming
- Review feedback is perceived as useful (not just "wrong / right") → qualitative feedback
- Task difficulty feels appropriate for the stated seniority → calibration
- Session time stays within 15–30 min → pacing

---

## 🔄 Open Decisions

| # | Question | Status |
|---|----------|--------|
| 1 | Frontend styling | ✅ **Tailwind CSS** |
| 2 | Auth provider | ✅ **Auth0** (managed, MVP — revisit for production) |
| 3 | AI provider | ✅ **Local Ollama** (MVP — revisit for production scale) |
| 3a | AI model | ✅ **DeepSeek-Coder 6.7B Q4_K_M** (`deepseek-coder:6.7b-instruct-q4_K_M`) |
| 4 | Soft skills tasks (standups, estimation, PR descriptions) | 🚫 **Not for MVP** — post-launch |
| 5 | Codebase evolution across tasks | 🚫 **Not for MVP** — static codebase per task |
| 6 | Multiplayer / team simulation | 🚫 **Not for MVP** — post-launch |
| 7 | Pixel art / animated room | 🚫 **Not for MVP** — static scene for now |
| 8 | Skill Profile granularity: coarse (player-facing) vs fine-grained (AI context) | ❓ Open |
| 9 | State management: Zustand vs Redux Toolkit | ❓ Open |

---

## 📁 Repo Structure (target)

```
coding-tycoon/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── game/      # room rendering, avatar, animations
│   │   └── store/     # state management
│   └── package.json
├── backend/           # Quarkus
│   ├── src/main/java/
│   │   ├── task/      # task generation & management
│   │   ├── review/    # AI review engine + feedback
│   │   ├── profile/   # skill profile: strengths, weak points, improvement signals
│   │   ├── user/      # auth, onboarding settings
│   │   └── vcs/       # virtual VCS logic
│   └── pom.xml
├── ai/                # AI prompt templates & evaluation
│   ├── prompts/       # task-generator, reviewer, skill-profiler prompt templates
│   └── evals/         # test cases for review quality
├── north_star.md      # this file
└── README.md
```

---

## 🧭 Guiding Principles

1. **Simulate, don't simplify.** Tasks should mirror real work, not toy problems.
2. **Feedback is the product.** The quality of the AI review IS the game.
3. **Daily habit over marathon sessions.** 15–30 min max per day.
4. **Fail fast on MVP.** Build the loop first, polish the world second.
5. **AI-assisted development.** Use AI tooling to build this project too — dogfood the concept.
