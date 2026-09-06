# P2-01 — Task Entity, Repository & Migration

**Phase:** 2 — Task Engine  
**Status:** 🔲 Not started  
**Depends on:** P1-01 (User), P1-02 (PlayerProfile)

---

## Goal

Create the `Task` entity, its port/adapter pair, and the Flyway migration. A `Task` belongs to a `PlayerProfile`, carries the full content of a coding ticket (title, description, acceptance criteria, difficulty, tags), and tracks its own status through the game's state machine.

---

## Acceptance Criteria

- [ ] `Task` entity in `dev.codingtycoon.task` with fields: `id`, `playerProfileId`, `title`, `description`, `acceptanceCriteria`, `difficulty`, `tags`, `status`, `createdAt`
- [ ] `TaskStatus` enum: `ASSIGNED`, `IN_PROGRESS`, `SUBMITTED`, `APPROVED`, `CHANGES_REQUESTED`
- [ ] `TaskRepository` port (interface): `findTodayForProfile`, `findById`, `save`
- [ ] `JpaTaskRepository` adapter (Panache)
- [ ] Flyway migration `V6__create_tasks_table.sql`
- [ ] Unit test: task can be persisted and retrieved by profile ID

---

## Implementation Notes

### Migration

```sql
-- db/migration/V6__create_tasks_table.sql
CREATE TABLE tasks (
    id                  BIGSERIAL    PRIMARY KEY,
    player_profile_id   BIGINT       NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    description         TEXT         NOT NULL,
    acceptance_criteria TEXT         NOT NULL,
    difficulty          VARCHAR(50)  NOT NULL DEFAULT 'Easy',
    tags                TEXT[]       NOT NULL DEFAULT '{}',
    status              VARCHAR(50)  NOT NULL DEFAULT 'ASSIGNED',
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

### Entity

```java
// task/Task.java
@Entity
@Table(name = "tasks")
public class Task extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "player_profile_id", nullable = false)
    public Long playerProfileId;

    @Column(nullable = false)
    public String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String description;

    @Column(name = "acceptance_criteria", nullable = false, columnDefinition = "TEXT")
    public String acceptanceCriteria;

    @Column(nullable = false)
    public String difficulty = "Easy";

    @Column(columnDefinition = "TEXT[]")
    public String[] tags = new String[]{};

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public TaskStatus status = TaskStatus.ASSIGNED;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now();
}
```

### TaskStatus enum

```java
// task/TaskStatus.java
public enum TaskStatus {
    ASSIGNED,
    IN_PROGRESS,
    SUBMITTED,
    APPROVED,
    CHANGES_REQUESTED
}
```

### Port

```java
// task/TaskRepository.java
public interface TaskRepository {
    /** Returns the most recent non-terminal task for the given profile, if any. */
    Optional<Task> findTodayForProfile(Long profileId);
    Optional<Task> findById(Long id);
    Task save(Task task);
}
```

### Adapter

```java
// task/JpaTaskRepository.java
@ApplicationScoped
public class JpaTaskRepository implements TaskRepository, PanacheRepository<Task> {

    @Override
    public Optional<Task> findTodayForProfile(Long profileId) {
        // Returns the most recent task that is not yet APPROVED
        return find("playerProfileId = ?1 AND status != ?2 ORDER BY createdAt DESC",
                profileId, TaskStatus.APPROVED)
                .firstResultOptional();
    }

    @Override
    public Optional<Task> findById(Long id) {
        return findByIdOptional(id);
    }

    @Override
    public Task save(Task task) {
        persistAndFlush(task);
        return task;
    }
}
```

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/task/
├── Task.java
├── TaskStatus.java
├── TaskRepository.java          ← port
└── JpaTaskRepository.java       ← adapter

backend/src/main/resources/db/migration/
└── V6__create_tasks_table.sql
```

---

## Definition of Done

- Migration runs cleanly after V5. Task entity can be persisted and queried by profile ID. Tests pass.
