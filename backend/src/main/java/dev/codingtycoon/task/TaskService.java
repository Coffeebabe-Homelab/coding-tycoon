package dev.codingtycoon.task;

import dev.codingtycoon.exception.ConflictException;
import dev.codingtycoon.exception.UnprocessableException;
import dev.codingtycoon.profile.ProfileRepository;
import dev.codingtycoon.task.seed.SeedTask;
import dev.codingtycoon.task.seed.SeedTaskService;
import dev.codingtycoon.user.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.util.List;

/**
 * Domain service for task management.
 * Handles task creation (from seed or AI), retrieval, and status transitions.
 * Depends only on port interfaces — never imports Panache or JPA directly.
 */
@ApplicationScoped
public class TaskService {

    @Inject
    TaskRepository taskRepository;

    @Inject
    ProfileRepository profileRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    SeedTaskService seedTaskService;

    @Inject
    TaskAiPort taskAiPort;

    /**
     * Returns the player's current active task, or creates a new one from a seed task if none exists.
     * "Active" means any status that is not APPROVED.
     *
     * @param sub the Auth0 subject claim identifying the player
     * @return a Pair where first=task and second=true if the task was just created, false if it already existed
     * @throws NotFoundException if no user or profile is found for the given sub
     */
    @Transactional
    public Pair<Task, Boolean> getOrCreateTodayTask(String sub) {
        var user = userRepository.findBySub(sub)
                .orElseThrow(() -> new NotFoundException("User not found"));
        var profile = profileRepository.findByUserId(user.id)
                .orElseThrow(() -> new NotFoundException("Profile not found"));

        return taskRepository.findTodayForProfile(profile.id)
                .map(task -> new Pair<>(task, false))
                .orElseGet(() -> {
                    List<String> topicSlugs = profile.topics.stream()
                            .map(t -> t.slug)
                            .toList();
                    SeedTask seed = seedTaskService.getForTopics(topicSlugs);
                    Task task = buildTask(profile.id, seed.title(), seed.description(),
                            seed.acceptanceCriteria(), seed.difficulty(), seed.tags());
                    taskRepository.save(task);
                    return new Pair<>(task, true);
                });
    }

    /**
     * Transitions a task to a new status, enforcing the allowed state machine rules.
     * <p>Allowed transitions:</p>
     * <ul>
     *   <li>ASSIGNED → IN_PROGRESS</li>
     *   <li>IN_PROGRESS → SUBMITTED</li>
     *   <li>SUBMITTED → APPROVED or CHANGES_REQUESTED</li>
     *   <li>CHANGES_REQUESTED → SUBMITTED</li>
     *   <li>APPROVED → (none — terminal state)</li>
     * </ul>
     *
     * @param taskId    the ID of the task to update
     * @param newStatus the desired target status
     * @return the updated task
     * @throws NotFoundException      if no task with the given ID exists
     * @throws UnprocessableException if the transition from the current status to newStatus is not allowed
     */
    @Transactional
    public Task transitionStatus(Long taskId, TaskStatus newStatus) {
        Task task = taskRepository.findTaskById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found: " + taskId));

        validateTransition(task.status, newStatus);
        task.status = newStatus;
        taskRepository.save(task);
        return task;
    }

    /**
     * Generates a new task for the player using the AI port, falling back to seed tasks if AI is unavailable.
     * Throws ConflictException if the player already has an active (non-APPROVED) task.
     *
     * @param sub the Auth0 subject claim identifying the player
     * @return the newly created task
     * @throws NotFoundException  if no user or profile is found for the given sub
     * @throws ConflictException  if an active task already exists for this player
     */
    @Transactional
    public Task generateTask(String sub) {
        var user = userRepository.findBySub(sub)
                .orElseThrow(() -> new NotFoundException("User not found"));
        var profile = profileRepository.findByUserId(user.id)
                .orElseThrow(() -> new NotFoundException("Profile not found"));

        if (taskRepository.findTodayForProfile(profile.id).isPresent()) {
            throw new ConflictException("An active task already exists for this player");
        }

        List<String> topicSlugs = profile.topics.stream()
                .map(t -> t.slug)
                .toList();

        // Attempt AI generation; fall back to seed if unavailable (stub always returns empty).
        var generated = taskAiPort.generate(profile.language, profile.seniority, topicSlugs);

        Task task;
        if (generated.isPresent()) {
            var g = generated.get();
            task = buildTask(profile.id, g.title(), g.description(), g.acceptanceCriteria(), g.difficulty(), g.tags());
        } else {
            SeedTask seed = seedTaskService.getForTopics(topicSlugs);
            task = buildTask(profile.id, seed.title(), seed.description(),
                    seed.acceptanceCriteria(), seed.difficulty(), seed.tags());
        }

        taskRepository.save(task);
        return task;
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private Task buildTask(Long profileId, String title, String description,
                           String acceptanceCriteria, String difficulty, String[] tags) {
        Task task = new Task();
        task.playerProfileId = profileId;
        task.title = title;
        task.description = description;
        task.acceptanceCriteria = acceptanceCriteria;
        task.difficulty = difficulty;
        task.tags = String.join(",", tags);
        task.status = TaskStatus.ASSIGNED;
        return task;
    }

    /**
     * Validates that a transition from currentStatus to newStatus is permitted.
     *
     * @throws UnprocessableException if the transition is not allowed
     */
    private void validateTransition(TaskStatus current, TaskStatus next) {
        boolean valid = switch (current) {
            case ASSIGNED -> next == TaskStatus.IN_PROGRESS;
            case IN_PROGRESS -> next == TaskStatus.SUBMITTED;
            case SUBMITTED -> next == TaskStatus.APPROVED || next == TaskStatus.CHANGES_REQUESTED;
            case CHANGES_REQUESTED -> next == TaskStatus.SUBMITTED;
            case APPROVED -> false; // terminal
        };

        if (!valid) {
            throw new UnprocessableException(
                    "Invalid status transition: " + current + " → " + next);
        }
    }
}
