package dev.codingtycoon.task.seed;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Stream;

/**
 * Provides pre-defined coding tasks used as a fallback when AI generation is unavailable.
 * Tasks cover the five core topics: REST APIs, CRUD, OOP, Clean Code, and Git Workflow.
 */
@ApplicationScoped
public class SeedTaskService {

    private static final List<SeedTask> SEEDS = List.of(
            new SeedTask(
                    "Build a REST endpoint to list all users",
                    "Create a GET /api/users endpoint that returns a paginated list of all registered users. "
                            + "Each user object should include id, email, and createdAt. "
                            + "The endpoint must accept optional query parameters: page (default 0) and size (default 20, max 100).",
                    "- GET /api/users returns 200 with a JSON array of user objects\n"
                            + "- Each object contains id (Long), email (String), createdAt (ISO 8601)\n"
                            + "- page and size query params control pagination\n"
                            + "- size > 100 returns 422\n"
                            + "- Unauthenticated request returns 401",
                    "Junior",
                    new String[]{"rest-apis", "crud", "java"}
            ),
            new SeedTask(
                    "Implement a CRUD service for a Note entity",
                    "Design and implement a NoteService that supports creating, reading, updating, and deleting notes. "
                            + "A note has a title (max 100 chars), body (text), and an ownerId. "
                            + "Only the owner should be able to update or delete their own notes.",
                    "- createNote(String ownerId, String title, String body) persists and returns the note\n"
                            + "- getNote(Long id) returns the note or throws NotFoundException\n"
                            + "- updateNote(Long id, String requesterId, String newTitle, String newBody) updates and returns the note; throws 403 if requesterId != ownerId\n"
                            + "- deleteNote(Long id, String requesterId) deletes the note; throws 403 if requesterId != ownerId\n"
                            + "- All methods have unit tests with ≥ 90% branch coverage",
                    "Junior",
                    new String[]{"crud", "java", "oop"}
            ),
            new SeedTask(
                    "Refactor a God Class into focused services",
                    "You are given a single UserManager class that handles authentication, profile management, "
                            + "email notifications, and audit logging. Refactor it into separate, focused classes following "
                            + "the Single Responsibility Principle.",
                    "- AuthenticationService handles login/logout only\n"
                            + "- ProfileService handles profile CRUD only\n"
                            + "- NotificationService handles email sending only\n"
                            + "- AuditService handles audit log writes only\n"
                            + "- No class exceeds 150 lines\n"
                            + "- All existing tests still pass after refactoring",
                    "Mid",
                    new String[]{"oop", "clean-code", "java"}
            ),
            new SeedTask(
                    "Add input validation to an existing REST API",
                    "The /api/orders endpoint currently accepts any JSON body without validation. "
                            + "Add Jakarta Bean Validation annotations so invalid requests are rejected with a 422 response "
                            + "and a clear error message listing which fields failed.",
                    "- @NotNull, @NotBlank, @Min, @Max annotations are applied to all Order fields\n"
                            + "- Invalid request body returns 422 with JSON: {\"error\": \"ValidationError\", \"fields\": [...]}\n"
                            + "- Valid request still returns 201\n"
                            + "- Tests cover: missing required field, negative quantity, blank productId",
                    "Junior",
                    new String[]{"rest-apis", "java", "clean-code"}
            ),
            new SeedTask(
                    "Implement the Repository pattern for a Product entity",
                    "Replace direct EntityManager calls scattered across the codebase with a clean ProductRepository "
                            + "interface and a JpaProductRepository implementation. The interface should be a plain Java "
                            + "interface with no Panache or JPA imports.",
                    "- ProductRepository interface defines: findById, findByCategory, save, delete\n"
                            + "- JpaProductRepository implements the interface using Panache\n"
                            + "- ProductService depends only on ProductRepository (not the Panache class)\n"
                            + "- Integration test verifies round-trip: save → findById → delete\n"
                            + "- No direct EntityManager usage remains outside the adapter",
                    "Mid",
                    new String[]{"oop", "crud", "java"}
            ),
            new SeedTask(
                    "Write a Git commit message convention linter",
                    "Implement a GitCommitLinter utility class that validates whether a commit message follows "
                            + "Conventional Commits format (type(scope): subject). It should return a list of violations "
                            + "with clear, actionable messages.",
                    "- validate(String message) returns List<String> of violations (empty = valid)\n"
                            + "- Detects: missing type, unknown type, missing colon, subject too long (>72 chars), empty subject\n"
                            + "- Accepted types: feat, fix, chore, docs, refactor, test, style\n"
                            + "- Unit tests cover each violation type and valid messages",
                    "Junior",
                    new String[]{"git-workflow", "clean-code", "java"}
            ),
            new SeedTask(
                    "Design an OOP class hierarchy for a game inventory system",
                    "Model a simple inventory system for a text adventure game using OOP principles. "
                            + "There are items (weapon, armour, consumable). Each item has a name, weight, and value. "
                            + "Weapons have an attackBonus; armour has a defenseBonus; consumables have a healAmount.",
                    "- Abstract Item base class with name, weight, value fields and abstract use() method\n"
                            + "- Weapon, Armour, Consumable extend Item with their specific fields\n"
                            + "- Inventory class holds a List<Item> with add, remove, getTotalWeight, findByName methods\n"
                            + "- Prefer composition for item effects where applicable\n"
                            + "- Unit tests cover: add, remove, total weight, use() for each item type",
                    "Junior",
                    new String[]{"oop", "java", "clean-code"}
            ),
            new SeedTask(
                    "Implement optimistic locking for a shared counter",
                    "A SharedCounter entity is updated concurrently by multiple threads. Add optimistic locking "
                            + "using JPA @Version to prevent lost updates. Write a test that simulates two concurrent "
                            + "increments and verifies that one succeeds and the other throws OptimisticLockException.",
                    "- SharedCounter entity has a @Version field\n"
                            + "- increment(Long id) reads and increments the counter in a transaction\n"
                            + "- Concurrent increment test: two threads both read the same version, one update succeeds, "
                            + "the other throws OptimisticLockException\n"
                            + "- Counter value after both attempts equals initialValue + 1",
                    "Senior",
                    new String[]{"java", "crud", "oop"}
            ),
            new SeedTask(
                    "Apply Clean Code naming and extraction to a legacy method",
                    "The method processData(List<Object[]> rows) is a 200-line method with cryptic variable names, "
                            + "magic numbers, and nested conditionals. Refactor it using Clean Code principles: "
                            + "meaningful names, extracted helper methods, and no magic numbers.",
                    "- No variable is named with a single letter or generic name (data, temp, obj)\n"
                            + "- Magic numbers are replaced with named constants\n"
                            + "- Each extracted method is ≤ 20 lines and has a single responsibility\n"
                            + "- The original processData method is ≤ 30 lines after refactoring\n"
                            + "- All existing unit tests still pass",
                    "Mid",
                    new String[]{"clean-code", "java", "oop"}
            ),
            new SeedTask(
                    "Set up a feature branch workflow with squash merging",
                    "Document and implement a Git workflow for a team of 3 developers. Each developer works on "
                            + "a feature branch, opens a PR, and the branch is squash-merged into main. "
                            + "Write a shell script that automates the branch creation and initial push.",
                    "- Written workflow document explains: branch naming, commit messages, PR process, merge strategy\n"
                            + "- Shell script: new-feature.sh <ticket-id> <description> creates branch feat/<ticket>-<description> and pushes it\n"
                            + "- Script fails with a clear message if the branch already exists\n"
                            + "- Script validates that description is non-empty and ticket-id matches pattern [A-Z]+-[0-9]+",
                    "Junior",
                    new String[]{"git-workflow", "clean-code"}
            )
    );

    /**
     * Returns all 10 seed tasks.
     *
     * @return immutable list of all seed tasks
     */
    public List<SeedTask> getAll() {
        return SEEDS;
    }

    /**
     * Returns a random seed task selected via ThreadLocalRandom.
     *
     * @return a randomly selected SeedTask
     */
    public SeedTask getRandom() {
        int index = ThreadLocalRandom.current().nextInt(SEEDS.size());
        return SEEDS.get(index);
    }

    /**
     * Returns a random seed task whose tags contain any of the provided topic slugs.
     * Falls back to a random task if no match is found.
     *
     * @param topicSlugs the list of topic slugs to match against task tags
     * @return a matching SeedTask, or a random one if no match exists
     */
    public SeedTask getForTopics(List<String> topicSlugs) {
        if (topicSlugs == null || topicSlugs.isEmpty()) {
            return getRandom();
        }

        var matchingSeeds = SEEDS.stream()
                .filter(seed -> Stream.of(seed.tags())
                        .anyMatch(topicSlugs::contains))
                .toList();

        if (matchingSeeds.isEmpty()) {
            return getRandom();
        }

        int index = ThreadLocalRandom.current().nextInt(matchingSeeds.size());
        return matchingSeeds.get(index);
    }
}
