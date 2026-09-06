# P2-02 — Seed Tasks (10 Hand-Crafted Java/Junior Tasks)

**Phase:** 2 — Task Engine  
**Status:** 🔲 Not started  
**Depends on:** P2-01 (Task entity and migration)

---

## Goal

Create 10 hand-crafted Java/Junior tasks stored as static seed data in the backend. These decouple the game from AI during development and testing — a player can complete the full loop without Ollama running. The tasks cover the topics from the player's onboarding options (REST APIs, CRUD, OOP, Clean Code, Git Workflow).

The seeds are not Flyway migrations (they're player-specific data, not schema). Instead they are loaded via a Quarkus startup event into a dedicated `SeedTaskService` and only inserted if no seed tasks exist yet.

---

## Acceptance Criteria

- [ ] 10 `SeedTask` records defined as Java constants (not SQL) in `dev.codingtycoon.task.seed`
- [ ] Each seed task has: `title`, `description`, `acceptanceCriteria`, `difficulty`, `tags` — no `playerProfileId` (assigned at request time)
- [ ] `SeedTaskService` loads the seed list; provides `getRandomSeedTask()` and `getAll()` methods
- [ ] Tasks cover all 5 topics: REST APIs (×3), CRUD (×2), OOP (×2), Clean Code (×2), Git Workflow (×1)
- [ ] Difficulty distribution: Easy (4), Medium (4), Hard (2)
- [ ] Each task description is realistic and references the synthetic codebase (a small Spring Boot app with `User` and `Product` entities — to be built in Phase 3)
- [ ] Unit test: all 10 seeds are returned by `SeedTaskService.getAll()`

---

## The 10 Seed Tasks

### REST APIs (×3)

**Task 1 — Easy**
- Title: `Implement GET /users endpoint`
- Description: The `UserController` class exists but the `GET /users` endpoint is missing. Implement it to return all users from the `UserRepository`. Return `200 OK` with a JSON array.
- Acceptance Criteria: `GET /users` returns `200` with all users; empty list returns `[]` not `null`; endpoint is mapped with `@GetMapping`

**Task 2 — Medium**
- Title: `Add GET /users/{id} with 404 handling`
- Description: Implement `GET /users/{id}` in `UserController`. If the user doesn't exist, return `404 Not Found` with a meaningful error message. Do not return `200` with a null body.
- Acceptance Criteria: `GET /users/1` returns user if exists; `GET /users/999` returns `404`; response body includes an `error` field on 404

**Task 3 — Medium**
- Title: `Implement POST /products with validation`
- Description: Implement `POST /products` in `ProductController`. The request body must include `name` (required, non-blank) and `price` (required, positive). Return `201 Created` with the saved product. Invalid input must return `400` — not `500`.
- Acceptance Criteria: Valid body saves product and returns `201`; missing `name` returns `400`; negative `price` returns `400`; uses `@Valid` and `@NotBlank`/`@Positive`

### CRUD (×2)

**Task 4 — Easy**
- Title: `Implement DELETE /users/{id}`
- Description: `UserController` is missing a delete endpoint. Implement `DELETE /users/{id}`. If the user exists, delete it and return `204 No Content`. If not found, return `404`.
- Acceptance Criteria: `DELETE /users/1` returns `204` and removes the user; `DELETE /users/999` returns `404`; subsequent `GET /users/1` returns `404`

**Task 5 — Medium**
- Title: `Implement PUT /products/{id} for full update`
- Description: Implement `PUT /products/{id}` in `ProductController`. Replace all fields of the product with the request body values. Return `200 OK` with the updated product. If not found, return `404`. Validate the request body.
- Acceptance Criteria: Valid `PUT` updates all fields and returns `200`; not found returns `404`; invalid body returns `400`; partial body (missing fields) returns `400`

### OOP (×2)

**Task 6 — Medium**
- Title: `Extract a service layer from UserController`
- Description: `UserController` currently calls `UserRepository` directly. Extract a `UserService` class that handles all business logic. The controller should only call the service — not the repository. Keep the existing endpoint behaviour unchanged.
- Acceptance Criteria: `UserService` exists and is `@Service`; `UserController` injects `UserService`, not `UserRepository`; all existing endpoints still work; no direct `UserRepository` imports in `UserController`

**Task 7 — Hard**
- Title: `Add a DiscountStrategy interface for product pricing`
- Description: Products can have different pricing strategies (no discount, percentage discount, fixed discount). Create a `DiscountStrategy` interface with an `applyDiscount(double price)` method, and implement `NoDiscount`, `PercentageDiscount`, and `FixedDiscount` classes. Wire the default strategy (`NoDiscount`) into `Product`.
- Acceptance Criteria: `DiscountStrategy` interface exists with `applyDiscount(double)`; all 3 implementations exist; `Product` has a `DiscountStrategy` field defaulting to `NoDiscount`; each implementation calculates correctly

### Clean Code (×2)

**Task 8 — Easy**
- Title: `Remove magic numbers from OrderService`
- Description: `OrderService` contains several magic numbers (e.g. `0.1` for tax rate, `50.0` for free shipping threshold). Extract them as named constants with clear names. The behaviour must not change.
- Acceptance Criteria: No numeric literals in `OrderService` methods; constants are `static final` with descriptive names; all existing tests still pass

**Task 9 — Hard**
- Title: `Break up a long method in ReportService`
- Description: `ReportService.generateMonthlyReport()` is 80 lines long and does too many things: fetches data, filters, transforms, formats, and writes to a string. Break it into focused private methods (single responsibility). The public method should read like a high-level summary of the steps.
- Acceptance Criteria: `generateMonthlyReport()` body is ≤ 15 lines; each extracted private method has a single clear responsibility; the output of the method is identical before and after; method names describe what they do

### Git Workflow (×1)

**Task 10 — Easy**
- Title: `Write a meaningful commit message for a bug fix`
- Description: You fixed a bug in `UserService.findById()` that was returning a deleted user. The fix is already applied. Your task: write the commit message following Conventional Commits format (`fix(scope): short description`). Provide the message as a string constant `COMMIT_MESSAGE` in a class called `CommitMessageExercise`.
- Acceptance Criteria: `COMMIT_MESSAGE` constant exists in `CommitMessageExercise`; follows format `fix(<scope>): <description>`; description explains what was wrong, not what the code does; under 72 characters

---

## Implementation Notes

```java
// task/seed/SeedTask.java
public record SeedTask(
    String title,
    String description,
    String acceptanceCriteria,
    String difficulty,
    String[] tags
) {}

// task/seed/SeedTaskService.java
@ApplicationScoped
public class SeedTaskService {

    private static final List<SeedTask> SEEDS = List.of(
        new SeedTask("Implement GET /users endpoint", "...", "...", "Easy", new String[]{"REST APIs"}),
        // ... all 10
    );

    /** Returns all seed tasks. */
    public List<SeedTask> getAll() {
        return SEEDS;
    }

    /** Returns a random seed task. Used when no AI-generated task is available. */
    public SeedTask getRandom() {
        return SEEDS.get(ThreadLocalRandom.current().nextInt(SEEDS.size()));
    }

    /** Returns a seed task matching the given tags, falling back to random if none match. */
    public SeedTask getForTopics(List<String> topicSlugs) {
        return SEEDS.stream()
            .filter(s -> Arrays.stream(s.tags()).anyMatch(topicSlugs::contains))
            .findFirst()
            .orElseGet(this::getRandom);
    }
}
```

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/task/seed/
├── SeedTask.java
└── SeedTaskService.java
```

---

## Definition of Done

- All 10 seeds are defined. `SeedTaskService.getAll()` returns all 10. `getForTopics()` returns a matching task. Unit tests pass.
