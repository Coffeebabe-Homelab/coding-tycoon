package dev.codingtycoon.task;

import dev.codingtycoon.exception.ConflictException;
import dev.codingtycoon.exception.UnprocessableException;
import dev.codingtycoon.profile.PlayerProfile;
import dev.codingtycoon.profile.ProfileRepository;
import dev.codingtycoon.progress.ProgressService;
import dev.codingtycoon.shared.Transactions;
import dev.codingtycoon.task.seed.SeedTask;
import dev.codingtycoon.task.seed.SeedTaskService;
import dev.codingtycoon.user.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.util.List;
import java.util.Optional;

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

    @Inject
    ProgressService progressService;

    @Inject
    Transactions transactions;

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
        PlayerProfile profile = requireLockedProfile(sub);

        return taskRepository.findTodayForProfile(profile.id)
                .map(task -> new Pair<>(task, false))
                .orElseGet(() -> {
                    List<String> topicSlugs = profile.topics.stream()
                            .map(t -> t.slug)
                            .toList();
                    Task task = buildTaskFromSeed(profile.id, seedTaskService.getForTopics(topicSlugs));
                    taskRepository.save(task);
                    return new Pair<>(task, true);
                });
    }

    /**
     * Returns the player's current active (non-APPROVED) task without creating one.
     *
     * @param sub the Auth0 subject claim identifying the player
     * @return the active task, or empty if the player has none
     * @throws NotFoundException if no user or profile is found for the given sub
     */
    @Transactional
    public Optional<Task> findActiveTask(String sub) {
        return taskRepository.findTodayForProfile(requireProfile(sub).id);
    }

    /**
     * Returns the player's newest task, including one approved a moment ago.
     *
     * @param sub the Auth0 subject claim identifying the player
     * @return the newest task, or empty if the player has none
     * @throws NotFoundException if no user or profile is found for the given sub
     */
    @Transactional
    public Optional<Task> findNewestTask(String sub) {
        return taskRepository.findNewestForProfile(requireProfile(sub).id);
    }

    /**
     * Applies a player's status change to one of their own tasks.
     * <p>Allowed transitions:</p>
     * <ul>
     *   <li>ASSIGNED → IN_PROGRESS</li>
     * </ul>
     * Submitting needs a push with code: see {@link #submit}. Review verdicts are not player
     * actions: see {@link #applyReviewVerdict}.
     *
     * @param sub       the Auth0 subject claim identifying the player
     * @param taskId    the ID of the task to update
     * @param newStatus the desired target status
     * @return the updated task
     * @throws NotFoundException      if the task doesn't exist or belongs to another player
     * @throws UnprocessableException if the transition from the current status to newStatus is not allowed
     */
    @Transactional
    public Task transitionStatus(String sub, Long taskId, TaskStatus newStatus) {
        Long profileId = requireProfile(sub).id;
        // 404 rather than 403, so the response doesn't reveal which task IDs exist.
        Task task = taskRepository.findTaskById(taskId)
                .filter(t -> profileId.equals(t.playerProfileId))
                .orElseThrow(() -> new NotFoundException("Task not found: " + taskId));

        changeStatus(task, newStatus, isPlayerTransition(task.status, newStatus));
        return task;
    }

    /**
     * Moves a task the player is working on to SUBMITTED. Called by the submission domain when
     * a push is stored, so a task can't be submitted without code.
     *
     * @param taskId the ID of the task being pushed
     * @return the updated task
     * @throws NotFoundException      if no task with the given ID exists
     * @throws UnprocessableException if the task isn't IN_PROGRESS or CHANGES_REQUESTED
     */
    @Transactional
    public Task submit(Long taskId) {
        Task task = taskRepository.findTaskById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found: " + taskId));

        boolean isWorkedOn = task.status == TaskStatus.IN_PROGRESS || task.status == TaskStatus.CHANGES_REQUESTED;
        changeStatus(task, TaskStatus.SUBMITTED, isWorkedOn);
        return task;
    }

    /**
     * Records the reviewer's verdict on a submitted task. Not exposed over HTTP: the review
     * engine (Phase 5) is the only intended caller. Approval awards the XP.
     *
     * @param taskId  the ID of the reviewed task
     * @param verdict APPROVED or CHANGES_REQUESTED
     * @return the updated task
     * @throws NotFoundException      if no task with the given ID exists
     * @throws UnprocessableException if the task isn't SUBMITTED or the status isn't a verdict
     */
    @Transactional
    public Task applyReviewVerdict(Long taskId, TaskStatus verdict) {
        Task task = taskRepository.findTaskById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found: " + taskId));

        boolean isVerdict = verdict == TaskStatus.APPROVED || verdict == TaskStatus.CHANGES_REQUESTED;
        changeStatus(task, verdict, task.status == TaskStatus.SUBMITTED && isVerdict);
        if (verdict == TaskStatus.APPROVED) {
            progressService.awardForApproval(task);
        }
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
    public Task generateTask(String sub) {
        // The model call can take minutes on CPU, so it runs between two short transactions.
        // Topics are lazy, so the input is read while the first transaction is open.
        GenerationInput input = transactions.inNewTransaction(() -> {
            PlayerProfile profile = requireProfile(sub);
            requireNoActiveTask(profile.id);
            return new GenerationInput(profile.id, profile.language, profile.seniority,
                    profile.topics.stream().map(t -> t.slug).toList());
        });

        // Falls back to a seed task when the AI is off, down or returns nothing usable.
        var generated = taskAiPort.generate(input.language(), input.seniority(), input.topics());

        return transactions.inNewTransaction(() -> {
            // Checked again under the lock: another request may have created a task meanwhile.
            requireNoActiveTask(requireLockedProfile(sub).id);
            Task task = generated
                    .map(g -> buildTask(input.profileId(), g.title(), g.description(), g.acceptanceCriteria(),
                            g.difficulty(), g.tags()))
                    .orElseGet(() -> buildTaskFromSeed(input.profileId(), seedTaskService.getForTopics(input.topics())));
            taskRepository.save(task);
            return task;
        });
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private record GenerationInput(Long profileId, String language, String seniority, List<String> topics) {}

    private void requireNoActiveTask(Long profileId) {
        if (taskRepository.findTodayForProfile(profileId).isPresent()) {
            throw new ConflictException("An active task already exists for this player");
        }
    }

    private PlayerProfile requireProfile(String sub) {
        var user = userRepository.findBySub(sub)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return profileRepository.findByUserId(user.id)
                .orElseThrow(() -> new NotFoundException("Profile not found"));
    }

    /** Task creation checks then inserts. The lock makes parallel callers take turns, so the next one sees the new task. */
    private PlayerProfile requireLockedProfile(String sub) {
        PlayerProfile profile = requireProfile(sub);
        profileRepository.lockForUpdate(profile.id);
        return profile;
    }

    private Task buildTaskFromSeed(Long profileId, SeedTask seed) {
        Task task = buildTask(profileId, seed.title(), seed.description(),
                seed.acceptanceCriteria(), seed.difficulty(), seed.tags());
        task.codebaseKey = seed.codebaseKey();
        task.focusFiles = String.join(",", seed.focusFiles());
        return task;
    }

    // AI-generated tasks keep the entity defaults: shopfront codebase, no focus files.
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

    private boolean isPlayerTransition(TaskStatus current, TaskStatus next) {
        return switch (current) {
            case ASSIGNED -> next == TaskStatus.IN_PROGRESS;
            // SUBMITTED only through submit(); verdicts only through applyReviewVerdict().
            case IN_PROGRESS, CHANGES_REQUESTED, SUBMITTED, APPROVED -> false;
        };
    }

    private void changeStatus(Task task, TaskStatus next, boolean allowed) {
        if (!allowed) {
            throw new UnprocessableException(
                    "Invalid status transition: " + task.status + " → " + next);
        }
        task.status = next;
        taskRepository.save(task);
    }
}
