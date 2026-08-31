# P1-02 — Topic Entity, PlayerProfile Entity & Migrations

**Phase:** 1 — Auth & Player Profile  
**Status:** 🔲 Not started  
**Depends on:** P1-01 (User entity and migration in place)  

---

## Goal

Create the `Topic` entity (the canonical list of available topics), the `PlayerProfile` entity, and the join table that links them. Add three Flyway migration scripts. This is the normalised foundation for player preferences — topics are stored in their own table, not as free-text strings on the profile.

---

## Why a separate topics table?

Topics are a shared vocabulary across all players. Storing them in a dedicated table means:
- The onboarding wizard loads available topics from the DB (`GET /api/topics`) rather than being hardcoded in the frontend.
- Analytics are trivial: count how many players selected each topic.
- Adding a new topic is a data change (one SQL insert), not a code change.

---

## Acceptance Criteria

- [ ] `Topic` entity exists in `dev.codingtycoon.topic` with fields: `id`, `name`, `slug`
- [ ] `TopicRepository` port and `JpaTopicRepository` adapter exist
- [ ] `PlayerProfile` entity exists in `dev.codingtycoon.profile` with fields: `id`, `userId`, `language`, `framework`, `seniority`; topics accessed via `@ManyToMany`
- [ ] `ProfileRepository` port and `JpaProfileRepository` adapter exist
- [ ] Flyway migration `V2__create_topics_table.sql` creates `topics` with `name UNIQUE` and `slug UNIQUE`
- [ ] Flyway migration `V3__create_player_profile_table.sql` creates `player_profiles`
- [ ] Flyway migration `V4__create_player_profile_topics_table.sql` creates the join table `player_profile_topics`
- [ ] Flyway migration `V5__seed_topics.sql` inserts the 5 initial topics
- [ ] `PlayerProfile` has a `UNIQUE` constraint on `user_id` (one profile per user)
- [ ] Unit test: profile can be persisted and retrieved by `userId` with topics resolved

---

## Implementation Notes

### Migration V2 — topics table

```sql
-- db/migration/V2__create_topics_table.sql
CREATE TABLE topics (
    id   BIGSERIAL    PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE
);
```

### Migration V3 — player_profiles table

```sql
-- db/migration/V3__create_player_profile_table.sql
CREATE TABLE player_profiles (
    id        BIGSERIAL   PRIMARY KEY,
    user_id   BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    language  VARCHAR(50) NOT NULL DEFAULT 'Java',
    framework VARCHAR(50) NOT NULL DEFAULT 'Spring Boot',
    seniority VARCHAR(50) NOT NULL DEFAULT 'Junior'
);
```

### Migration V4 — join table

```sql
-- db/migration/V4__create_player_profile_topics_table.sql
CREATE TABLE player_profile_topics (
    profile_id BIGINT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    topic_id   BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, topic_id)
);
```

### Migration V5 — seed topics

```sql
-- db/migration/V5__seed_topics.sql
INSERT INTO topics (name, slug) VALUES
    ('REST APIs',   'rest-apis'),
    ('CRUD',        'crud'),
    ('OOP',         'oop'),
    ('Clean Code',  'clean-code'),
    ('Git Workflow','git-workflow');
```

### Topic entity

```java
// topic/Topic.java
@Entity
@Table(name = "topics")
public class Topic extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true)
    public String name;

    @Column(nullable = false, unique = true)
    public String slug;
}
```

### PlayerProfile entity

```java
// profile/PlayerProfile.java
@Entity
@Table(name = "player_profiles")
public class PlayerProfile extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    public Long userId;

    @Column(nullable = false)
    public String language = "Java";

    @Column(nullable = false)
    public String framework = "Spring Boot";

    @Column(nullable = false)
    public String seniority = "Junior";

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "player_profile_topics",
        joinColumns = @JoinColumn(name = "profile_id"),
        inverseJoinColumns = @JoinColumn(name = "topic_id")
    )
    public List<Topic> topics = new ArrayList<>();
}
```

### TopicRepository port & adapter

```java
// topic/TopicRepository.java
public interface TopicRepository {
    List<Topic> findAll();
    List<Topic> findByIds(List<Long> ids);
}

// topic/JpaTopicRepository.java
@ApplicationScoped
public class JpaTopicRepository implements TopicRepository, PanacheRepository<Topic> {

    @Override
    public List<Topic> findAll() {
        return listAll();
    }

    @Override
    public List<Topic> findByIds(List<Long> ids) {
        return list("id IN ?1", ids);
    }
}
```

### ProfileRepository port & adapter

```java
// profile/ProfileRepository.java
public interface ProfileRepository {
    Optional<PlayerProfile> findByUserId(Long userId);
    PlayerProfile save(PlayerProfile profile);
}

// profile/JpaProfileRepository.java
@ApplicationScoped
public class JpaProfileRepository implements ProfileRepository, PanacheRepository<PlayerProfile> {

    @Override
    public Optional<PlayerProfile> findByUserId(Long userId) {
        return find("userId", userId).firstResultOptional();
    }

    @Override
    public PlayerProfile save(PlayerProfile profile) {
        persistAndFlush(profile);
        return profile;
    }
}
```

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/
├── topic/
│   ├── Topic.java
│   ├── TopicRepository.java         ← port
│   └── JpaTopicRepository.java      ← adapter
└── profile/
    ├── PlayerProfile.java
    ├── ProfileRepository.java        ← port
    └── JpaProfileRepository.java     ← adapter

backend/src/main/resources/db/migration/
├── V2__create_topics_table.sql
├── V3__create_player_profile_table.sql
├── V4__create_player_profile_topics_table.sql
└── V5__seed_topics.sql
```

---

## Definition of Done

- All 4 migrations run in order without errors. Profile with topics can be persisted and retrieved. Tests pass.
