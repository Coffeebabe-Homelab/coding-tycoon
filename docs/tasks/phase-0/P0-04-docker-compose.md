# P0-04 — Docker Compose for Local Dev

**Phase:** 0 — Foundation  
**Status:** 🔲 Not started  
**Depends on:** P0-02, P0-03  

---

## Goal

A single `docker-compose.yml` at repo root that starts PostgreSQL and Ollama for local development, so any contributor can run the full stack with one command.

---

## Acceptance Criteria

- [ ] `docker-compose.yml` exists at repo root
- [ ] `docker compose up -d` starts both PostgreSQL and Ollama containers
- [ ] PostgreSQL is reachable on `localhost:5432` with configured credentials
- [ ] Ollama is reachable on `localhost:11434`
- [ ] Ollama container automatically pulls the configured model on first start (init script or entrypoint)
- [ ] Data volumes defined for PostgreSQL (data persists across restarts)
- [ ] `.env.example` documents all required environment variables
- [ ] `README.md` updated with `docker compose up -d` as the first setup step

---

## Implementation Notes

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: codingtycoon
      POSTGRES_USER: ${DB_USER:-codingtycoon}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-codingtycoon}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    entrypoint: ["/bin/sh", "-c", "ollama serve & sleep 5 && ollama pull codellama && wait"]

volumes:
  postgres_data:
  ollama_data:
```

```bash
# .env.example
DB_USER=codingtycoon
DB_PASSWORD=codingtycoon
```

**Note on Quarkus Dev Services:** Quarkus auto-starts its own PostgreSQL Testcontainer in dev/test mode. The Docker Compose PostgreSQL is for running the backend outside of `quarkus:dev` (e.g. production-like local testing or frontend-only development). Both approaches should work — configure via profile:

```properties
# application.properties
%prod.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/codingtycoon
%prod.quarkus.datasource.username=${DB_USER}
%prod.quarkus.datasource.password=${DB_PASSWORD}
```

---

## Definition of Done

- `docker compose up -d` succeeds, both services healthy, Ollama model pulled and callable.
