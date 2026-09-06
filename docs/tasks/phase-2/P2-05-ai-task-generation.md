# P2-05 — AI Task Generation (POST /api/tasks/generate)

**Phase:** 2 — Task Engine  
**Status:** 🔲 Not started  
**Depends on:** P2-03 (TaskService, SeedTaskService), P2-01 (Task entity)

---

## Goal

Add AI-powered task generation as an enhancement on top of the seed fallback. `POST /api/tasks/generate` calls Ollama to generate a personalised task based on the player's profile and topics. If Ollama is unavailable or returns an unparseable response, it falls back to seed data silently — the player never sees an error because of AI failure.

This task also wires up the `quarkus-langchain4j-ollama` extension that was deferred in Phase 0 due to a version compatibility issue. If the issue is still unresolved at build time, the AI port stays as a stub adapter that always falls back to seed data and the task is considered complete.

---

## Acceptance Criteria

- [ ] `TaskAiPort` interface defined in `dev.codingtycoon.task`
- [ ] `OllamaTaskAdapter` implements `TaskAiPort` using LangChain4j (or is a stub if extension is incompatible)
- [ ] `StubTaskAdapter` always falls back to seed data — used in tests and when Ollama is unavailable
- [ ] `TaskService.generateTask(String sub)` calls `TaskAiPort`, falls back to seed on failure
- [ ] `POST /api/tasks/generate` triggers AI generation and returns the created task (`201`)
- [ ] `POST /api/tasks/generate` returns `409 Conflict` if the player already has an active task
- [ ] Prompt template stored in `src/main/resources/prompts/task-generator.txt`
- [ ] AI response parsed into a `Task` — if parsing fails, fall back to seed, log a `WARN`
- [ ] In tests, `TaskAiPort` is always mocked — never calls real Ollama in CI
- [ ] Integration tests cover: generate task (mocked AI), fallback on AI failure, duplicate task conflict

---

## API Contract

### POST /api/tasks/generate

No request body. Uses the authenticated player's profile.

**Response 201:** same `TaskResponse` shape as `GET /api/tasks/today`.  
**Response 409:** `{ "error": "Conflict", "message": "You already have an active task", "status": 409 }`  
**Response 404:** profile not found.

---

## AI Port & Adapter

```java
// task/TaskAiPort.java
public interface TaskAiPort {
    /**
     * Generates a task specification for the given player profile.
     * Returns empty if generation fails or AI is unavailable.
     */
    Optional<GeneratedTask> generate(String language, String seniority, List<String> topics);
}

// task/GeneratedTask.java — result type
public record GeneratedTask(
    String title,
    String description,
    String acceptanceCriteria,
    String difficulty,
    String[] tags
) {}
```

### Ollama adapter (implement only if extension is compatible)

```java
// task/OllamaTaskAdapter.java
@ApplicationScoped
@IfBuildProfile("!test")  // excluded from test builds
public class OllamaTaskAdapter implements TaskAiPort {

    @RegisterAiService
    interface OllamaProxy {
        @SystemMessage("""
            You are a senior Java developer creating coding tasks for junior developers.
            Return ONLY valid JSON matching this structure:
            {"title":"...","description":"...","acceptanceCriteria":"...","difficulty":"Easy|Medium|Hard","tags":["..."]}
            No explanation, no markdown, just JSON.
            """)
        @UserMessage("Generate a task for: language={{language}}, seniority={{seniority}}, topics={{topics}}")
        String generate(String language, String seniority, String topics);
    }

    @Inject OllamaProxy proxy;

    @Override
    public Optional<GeneratedTask> generate(String language, String seniority, List<String> topics) {
        try {
            String raw = proxy.generate(language, seniority, String.join(", ", topics));
            return Optional.of(parseJson(raw));
        } catch (Exception e) {
            Log.warnf("AI task generation failed, will fall back to seed: %s", e.getMessage());
            return Optional.empty();
        }
    }
}
```

### Stub adapter (always used in tests)

```java
// task/StubTaskAdapter.java
@ApplicationScoped
@IfBuildProfile("test")
public class StubTaskAdapter implements TaskAiPort {
    @Override
    public Optional<GeneratedTask> generate(String language, String seniority, List<String> topics) {
        return Optional.empty(); // always triggers seed fallback in tests
    }
}
```

### TaskService.generateTask

```java
/**
 * Generates a task using AI, falling back to seed data if AI is unavailable.
 * Throws ConflictException if the player already has an active task.
 */
@Transactional
public Task generateTask(String sub) {
    var user = userRepository.findBySub(sub)
        .orElseThrow(() -> new NotFoundException("User not found"));
    var profile = profileRepository.findByUserId(user.id)
        .orElseThrow(() -> new NotFoundException("Profile not found"));

    if (taskRepository.findTodayForProfile(profile.id).isPresent()) {
        throw new ConflictException("You already have an active task");
    }

    var topicSlugs = profile.topics.stream().map(t -> t.slug).toList();
    var topicNames = profile.topics.stream().map(t -> t.name).toList();

    var generated = taskAiPort.generate(profile.language, profile.seniority, topicNames);

    var task = new Task();
    task.playerProfileId = profile.id;
    if (generated.isPresent()) {
        var g = generated.get();
        task.title = g.title();
        task.description = g.description();
        task.acceptanceCriteria = g.acceptanceCriteria();
        task.difficulty = g.difficulty();
        task.tags = g.tags();
    } else {
        // Fallback: use seed data
        var seed = seedTaskService.getForTopics(topicSlugs);
        task.title = seed.title();
        task.description = seed.description();
        task.acceptanceCriteria = seed.acceptanceCriteria();
        task.difficulty = seed.difficulty();
        task.tags = seed.tags();
    }
    task.status = TaskStatus.ASSIGNED;
    return taskRepository.save(task);
}
```

### Prompt template

```
src/main/resources/prompts/task-generator.txt

You are a senior Java developer creating coding tasks for junior developers.
The player is working on a small Spring Boot application with User and Product entities.

Player profile:
- Language: {language}
- Seniority: {seniority}
- Topics of interest: {topics}

Generate ONE coding task. Return ONLY valid JSON, no markdown, no explanation:
{
  "title": "Short imperative task title",
  "description": "2-3 sentence context. What exists, what is missing, what to implement.",
  "acceptanceCriteria": "Line 1\nLine 2\nLine 3",
  "difficulty": "Easy|Medium|Hard",
  "tags": ["one of the player's topics"]
}
```

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/task/
├── TaskAiPort.java
├── GeneratedTask.java
├── OllamaTaskAdapter.java    ← Ollama implementation (or kept as stub if incompatible)
├── StubTaskAdapter.java      ← test/fallback stub
└── TaskResource.java         ← add POST /api/tasks/generate

backend/src/main/resources/prompts/
└── task-generator.txt
```

---

## Note on the Ollama extension

Check whether the `quarkus-langchain4j-ollama` compatibility issue is resolved before implementing `OllamaTaskAdapter`. If not, mark the adapter as a stub that always returns `Optional.empty()` and document it. The seed fallback ensures the game is fully playable regardless — AI generation is an enhancement, not a dependency.

---

## Definition of Done

- `POST /api/tasks/generate` creates a task (AI or seed fallback). AI failure is handled gracefully. Tests pass without real Ollama. `./mvnw verify` passes.
