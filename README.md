# Coding Tycoon

> A browser-based game that teaches real coding skills through a simulated developer workday.

[![CI](https://github.com/Pedro-Appel/codign-tycoon/actions/workflows/ci.yml/badge.svg)](https://github.com/Pedro-Appel/codign-tycoon/actions/workflows/ci.yml)

---

## What is this?

Coding Tycoon simulates the full professional developer cycle — task → code → review → iterate — inside an engaging, gamified environment. Every session is one in-game "workday": your manager drops a ticket, you explore the codebase, write the fix, push it, and wait for the AI senior dev's review.

See [north_star.md](./north_star.md) for the full vision and [ROADMAP.md](./ROADMAP.md) for the delivery plan.

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Java 21+](https://adoptium.net/) (Temurin recommended)
- [Docker + Docker Compose](https://docs.docker.com/get-docker/)
- [Auth0 account](https://auth0.com/) (free tier)

> **Java 25:** The project targets Java 25 but runs on 21 until Java 25 is widely available.
> Install via SDKMAN: `sdk install java 25-tem`

---

## Local Setup

### 1. Clone and enter the repo

```bash
git clone git@github.com:Pedro-Appel/codign-tycoon.git
cd codign-tycoon
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL on `:5432` and Ollama on `:11434`.
On first run, Ollama will pull **DeepSeek-Coder 6.7B Q4_K_M** (~4 GB) — this takes a few minutes.

### 3. Configure Auth0

Follow the [Auth0 Setup](#auth0-setup) section below, then come back here.

### 4. Configure environment variables

Copy the example file and fill in your Auth0 values:

```bash
cp .env.example frontend/.env.local
```

Edit `frontend/.env.local`:

```env
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-spa-client-id
VITE_AUTH0_AUDIENCE=https://api.codingtycoon.dev
VITE_API_BASE_URL=http://localhost:8080
```

For the backend, set environment variables before starting:

```bash
export AUTH0_DOMAIN=your-tenant.auth0.com
export AUTH0_AUDIENCE=https://api.codingtycoon.dev
```

### 5. Start the backend

```bash
cd backend
./mvnw quarkus:dev
```

Backend starts on `http://localhost:8080`. Dev Services spins up its own PostgreSQL container automatically in dev mode.

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`.

---

## Auth0 Setup

1. Log in to [auth0.com](https://auth0.com/) and create a tenant (e.g. `codingtycoon-dev`)
2. **Applications → Create Application** → Single Page Application → React
3. In the application settings, set:
   - **Allowed Callback URLs:** `http://localhost:5173/callback`
   - **Allowed Logout URLs:** `http://localhost:5173`
   - **Allowed Web Origins:** `http://localhost:5173`
4. **APIs → Create API:**
   - Name: `Coding Tycoon Backend`
   - Identifier: `https://api.codingtycoon.dev`
   - Signing algorithm: RS256
5. Copy your **Domain** and **Client ID** into `frontend/.env.local`

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain (e.g. `xyz.auth0.com`) |
| `VITE_AUTH0_CLIENT_ID` | SPA client ID from Auth0 dashboard |
| `VITE_AUTH0_AUDIENCE` | API identifier — `https://api.codingtycoon.dev` |
| `VITE_API_BASE_URL` | Backend URL — `http://localhost:8080` |

### Backend (env vars or system properties)

| Variable | Description |
|---|---|
| `AUTH0_DOMAIN` | Auth0 tenant domain |
| `AUTH0_AUDIENCE` | API identifier — `https://api.codingtycoon.dev` |
| `DB_USER` | PostgreSQL username (prod only; dev uses Dev Services) |
| `DB_PASSWORD` | PostgreSQL password (prod only) |

---

## Running Tests

```bash
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd backend
./mvnw verify
```

Backend tests use Quarkus Dev Services — Docker must be running. AI services are mocked in tests; no Ollama needed.

---

## Project Docs

| Document | Purpose |
|---|---|
| [north_star.md](./north_star.md) | Vision, gameplay loop, architecture decisions |
| [ROADMAP.md](./ROADMAP.md) | Phase-by-phase delivery plan |
| [docs/DEVELOPMENT_GUIDELINES.md](./docs/DEVELOPMENT_GUIDELINES.md) | Coding patterns, testing strategy, Git workflow |
| [backend/SPEC.md](./backend/SPEC.md) | Backend architecture, API conventions, data model |
| [frontend/SPEC.md](./frontend/SPEC.md) | Frontend architecture, component structure, state management |
