# P1-01 — User Entity, Repository & Flyway Migration

**Phase:** 1 — Auth & Player Profile  
**Status:** 🔲 Not started  
**Depends on:** P0-02 (backend initialised), P0-07 (Auth0 JWT wired)  

---

## Goal

Create the `User` entity, its port/adapter pair, and the first Flyway migration script. This establishes the database foundation for all player data — every subsequent entity will reference `User` via the Auth0 `sub` claim.

---

## Acceptance Criteria

- [ ] `quarkus-flyway` extension added to `pom.xml`
- [ ] `User` entity exists in `dev.codingtycoon.user` with fields: `id`, `sub`, `email`, `createdAt`
- [ ] `UserRepository` interface (port) defined in `dev.codingtycoon.user`
- [ ] `JpaUserRepository` (Panache adapter) implements `UserRepository`
- [ ] Flyway migration `V1__create_user_table.sql` creates the `users` table with a `UNIQUE` constraint on `sub`
- [ ] `application.properties` configured to run Flyway in prod mode; dev mode continues using `drop-and-create`
- [ ] Unit test: `JpaUserRepository` can persist and retrieve a `User` by `sub`
- [ ] `MeResource` moved from root package into `dev.codingtycoon.user`

---

## Implementation Notes

### Flyway setup

```xml
<!-- pom.xml -->
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-flyway</artifactId>
</dependency>
```

```properties
# application.properties — dev keeps drop-and-create, prod runs Flyway
%prod.quarkus.flyway.migrate-at-start=true
%prod.quarkus.hibernate-orm.database.generation=validate
```

### Migration script

```sql
-- src/main/resources/db/migration/V1__create_user_table.sql
CREATE TABLE users (
    id         BIGSERIAL    PRIMARY KEY,
    sub        VARCHAR(255) NOT NULL UNIQUE,
    email      VARCHAR(255),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

### Entity

```java
// user/User.java
@Entity
@Table(name = "users")
public class User extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true)
    public String sub;

    public String email;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now();
}
```

### Port (interface)

```java
// user/UserRepository.java
public interface UserRepository {
    Optional<User> findBySub(String sub);
    User save(User user);
}
```

### Adapter (Panache implementation)

```java
// user/JpaUserRepository.java
@ApplicationScoped
public class JpaUserRepository implements UserRepository, PanacheRepository<User> {

    @Override
    public Optional<User> findBySub(String sub) {
        return find("sub", sub).firstResultOptional();
    }

    @Override
    public User save(User user) {
        persist(user);
        return user;
    }
}
```

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/user/
├── User.java
├── UserRepository.java         ← port
├── JpaUserRepository.java      ← adapter
├── UserService.java            ← moved/unchanged (will be extended in P1-03)
└── UserResource.java           ← MeResource renamed/moved here

backend/src/main/resources/db/migration/
└── V1__create_user_table.sql
```

---

## Definition of Done

- Migration runs cleanly on a fresh DB. `User` can be persisted and looked up by `sub`. Tests pass.
