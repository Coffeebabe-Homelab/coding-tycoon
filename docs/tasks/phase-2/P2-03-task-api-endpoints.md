# P2-03 — Task API: GET /api/tasks/today & Status State Machine

**Phase:** 2 — Task Engine  
**Status:** 🔲 Not started  
**Depends on:** P2-01 (Task entity), P2-02 (Seed tasks)

---

## Goal

Expose the endpoints the frontend needs to drive the task loop. `GET /api/tasks/today` is the key endpoint — it returns the player's current task, creating one from seed data if none exists yet. `PATCH /api/tasks/{id}/status` advances the task through the state machine. `TaskService` owns all transition logic.

---

## Acceptance Criteria

- [ ] `GET /api/tasks/today` returns the player's active task (`200 OK`) or creates one from seed data if none exists (`201 Created`)
- [ ] `GET /api/tasks/today` returns `404` if the player has no profile yet
- [ ] `PATCH /api/tasks/{id}/status` transitions the task status; invalid transitions return `422`
- [ ] `TaskService` enforces the state machine — no invalid transitions reach the DB
- [ ] `TaskService.getOrCreateTodayTask()` picks a seed task matched to the player's profile topics
- [ ] `TaskResource` and `TaskService` exist in `dev.codingtycoon.task`
- [ ] `TaskResponse` DTO returned from both endpoints (never the raw entity)
- [ ] Both endpoints require auth (`@Authenticated`)
- [ ] Integration tests cover: get task (creates new), get task (returns existing), invalid transition, unauthenticated

---

## State Machine

```
ASSIGNED → IN_PROGRESS     (player opens the task)
IN_PROGRESS → SUBMITTED    (player pushes code — Phase 4)
SUBMITTED → APPROVED       (AI review passes — Phase 5)
SUBMITTED → CHANGES_REQUESTED  (AI review requests changes — Phase 5)
CHANGES_REQUESTED → SUBMITTED  (player re-submits — Phase 5)
```

Terminal states: `APPROVED` (task is done, a new task can be created tomorrow).  
Invalid transitions (e.g. `ASSIGNED → APPROVED`) must return `422 Unprocessable`.

---

## API Contract

### GET /api/tasks/today

Returns the player's current active task. If no active task exists, creates one from seed data and returns `201`.

**Response 200 / 201:**
```json
{
  "id": 1,
  "title": "Implement GET /users endpoint",
  "description": "The UserController class exists but...",
  "acceptanceCriteria": "GET /users returns 200 with all users...",
  "difficulty": "Easy",
  "tags": ["REST APIs"],
  "status": "ASSIGNED",
  "createdAt": "2026-09-06T12:00:00Z"
}
```

**Response 404:** profile not found for this user.

### PATCH /api/tasks/{id}/status

**Request body:**
```json
{ "status": "IN_PROGRESS" }
```

**Response 200:** updated task (same shape as above).  
**Response 422:** invalid transition with message explaining why.  
**Response 404:** task not found.

---

## Implementation Notes

### TaskResponse DTO

```java
// task/TaskResponse.java
public record TaskResponse(
    Long id, String title, String description, String acceptanceCriteria,
    String difficulty, List<String> tags, String status, String createdAt
) {
    public static TaskResponse from(Task t) {
        return new TaskResponse(
            t.id, t.title, t.description, t.acceptanceCriteria,
            t.difficulty, List.of(t.tags), t.status.name(),
            t.createdAt.toString()
        );
    }
}
```

### UpdateTaskStatusRequest DTO

```java
// task/UpdateTaskStatusRequest.java
public class UpdateTaskStatusRequest {
    @NotNull public TaskStatus status;
}
```

### TaskService (key logic)

```java
@ApplicationScoped
public class TaskService {

    @Inject TaskRepository taskRepository;
    @Inject ProfileRepository profileRepository;
    @Inject UserRepository userRepository;
    @Inject SeedTaskService seedTaskService;

    /**
     * Returns the player's current active task.
     * If none exists, creates one from seed data matching the player's topics.
     * Returns a Pair<Task, Boolean> where Boolean indicates if the task was just created.
     */
    @Transactional
    public Pair<Task, Boolean> getOrCreateTodayTask(String sub) {
        var user = userRepository.findBySub(sub)
            .orElseThrow(() -> new NotFoundException("User not found"));
        var profile = profileRepository.findByUserId(user.id)
            .orElseThrow(() -> new NotFoundException("Profile not found"));

        return taskRepository.findTodayForProfile(profile.id)
            .map(t -> Pair.of(t, false))
            .orElseGet(() -> {
                var topicSlugs = profile.topics.stream()
                    .map(t -> t.slug).toList();
                var seed = seedTaskService.getForTopics(topicSlugs);
                var task = new Task();
                task.playerProfileId = profile.id;
                task.title = seed.title();
                task.description = seed.description();
                task.acceptanceCriteria = seed.acceptanceCriteria();
                task.difficulty = seed.difficulty();
                task.tags = seed.tags();
                task.status = TaskStatus.ASSIGNED;
                return Pair.of(taskRepository.save(task), true);
            });
    }

    /**
     * Transitions the task to a new status.
     * Throws UnprocessableException if the transition is invalid.
     */
    @Transactional
    public Task transitionStatus(Long taskId, TaskStatus newStatus) {
        var task = taskRepository.findById(taskId)
            .orElseThrow(() -> new NotFoundException("Task not found"));
        validateTransition(task.status, newStatus);
        task.status = newStatus;
        return taskRepository.save(task);
    }

    private void validateTransition(TaskStatus current, TaskStatus next) {
        boolean valid = switch (current) {
            case ASSIGNED           -> next == TaskStatus.IN_PROGRESS;
            case IN_PROGRESS        -> next == TaskStatus.SUBMITTED;
            case SUBMITTED          -> next == TaskStatus.APPROVED || next == TaskStatus.CHANGES_REQUESTED;
            case CHANGES_REQUESTED  -> next == TaskStatus.SUBMITTED;
            case APPROVED           -> false; // terminal
        };
        if (!valid) {
            throw new UnprocessableException(
                "Invalid transition: %s → %s".formatted(current, next));
        }
    }
}
```

> Note: `Pair` can use a simple record `record Pair<A, B>(A first, B second) {}` defined locally, or Apache Commons Lang if already on classpath. Keep it simple.

### TaskResource

```java
@Path("/api/tasks")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TaskResource {

    @Inject TaskService taskService;
    @Inject JsonWebToken jwt;

    /** Returns today's task, creating from seed if none exists. */
    @GET
    @Path("/today")
    public Response today() {
        var result = taskService.getOrCreateTodayTask(jwt.getSubject());
        int status = result.second() ? 201 : 200;
        return Response.status(status).entity(TaskResponse.from(result.first())).build();
    }

    /** Transitions the task status. */
    @PATCH
    @Path("/{id}/status")
    public Response updateStatus(@PathParam("id") Long id, @Valid UpdateTaskStatusRequest req) {
        var task = taskService.transitionStatus(id, req.status);
        return Response.ok(TaskResponse.from(task)).build();
    }
}
```

### Exception additions

Add to `ExceptionMappers`:
- `UnprocessableException` (new custom exception) → 422

---

## File Locations

```
backend/src/main/java/dev/codingtycoon/task/
├── TaskResponse.java
├── UpdateTaskStatusRequest.java
├── TaskService.java
└── TaskResource.java

backend/src/main/java/dev/codingtycoon/exception/
└── UnprocessableException.java   ← new
```

---

## Definition of Done

- `GET /api/tasks/today` creates and returns a task on first call; returns same task on repeat calls. Status transitions work and reject invalid ones. Integration tests green. `./mvnw verify` passes.
