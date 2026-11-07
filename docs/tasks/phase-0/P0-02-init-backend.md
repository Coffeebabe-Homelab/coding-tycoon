# P0-02 — Initialise Backend

**Phase:** 0 — Foundation  
**Status:** ✅ Complete  
**Depends on:** —  

---

## Goal

Scaffold the `backend/` directory as a Quarkus project with REST, Panache ORM, and Dev Services for PostgreSQL. The result is a running Quarkus dev server with a health endpoint responding green.

---

## Acceptance Criteria

- [x] `backend/` directory exists at repo root
- [x] `./mvnw quarkus:dev` starts the Quarkus dev server on `http://localhost:8080`
- [x] `GET /q/health` returns `{"status": "UP"}`
- [x] Dev Services auto-starts a PostgreSQL container (no manual DB setup needed)
- [x] A `HealthCheckResource` or equivalent test endpoint returns 200
- [x] `./mvnw test` runs and passes (at least the scaffolded Quarkus tests)
- [x] Java 25 used as the runtime
- [x] Panache ORM with Hibernate configured (Quarkus Dev Services handles the DB URL)

---

## Implementation Notes

Use the Quarkus CLI or `code.quarkus.io` to generate the project with these extensions:

```
quarkus-resteasy-reactive-jackson   # JAX-RS with JSON
quarkus-hibernate-orm-panache       # Active Record ORM
quarkus-jdbc-postgresql             # PostgreSQL JDBC driver
quarkus-smallrye-health             # Health checks (/q/health)
quarkus-hibernate-validator         # Bean validation (@Valid, @NotNull)
```

```bash
quarkus create app dev.codingtycoon:backend \
  --extension='resteasy-reactive-jackson,hibernate-orm-panache,jdbc-postgresql,smallrye-health,hibernate-validator' \
  --java=25 \
  --no-code
```

**Dev Services** (zero config — Quarkus spins up a Testcontainers PostgreSQL automatically in dev/test mode):
```properties
# application.properties — dev services is on by default, no DB URL needed in dev
quarkus.datasource.db-kind=postgresql
quarkus.hibernate-orm.database.generation=drop-and-create  # dev only
```

---

## File Structure (expected output)

```
backend/
├── src/
│   ├── main/
│   │   ├── java/dev/codingtycoon/
│   │   │   └── HealthResource.java   ← simple GET /api/health
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/dev/codingtycoon/
│           └── HealthResourceTest.java
├── pom.xml
├── mvnw
└── SPEC.md   ← created in P0-11
```

---

## Definition of Done

- `./mvnw quarkus:dev` starts cleanly, health endpoint green, Dev Services DB connected, tests pass.
