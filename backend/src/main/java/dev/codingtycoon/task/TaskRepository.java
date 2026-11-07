package dev.codingtycoon.task;

import java.util.Optional;

/**
 * Port interface for task persistence.
 * Services depend on this interface; Panache-specific code lives in JpaTaskRepository.
 */
public interface TaskRepository {

    /**
     * Returns the most recent active task for a given player profile.
     * "Active" means status is NOT APPROVED, ordered by createdAt descending.
     *
     * @param profileId the player profile ID
     * @return an Optional containing the most recent active task, or empty if none exists
     */
    Optional<Task> findTodayForProfile(Long profileId);

    /**
     * Finds a task by its primary key.
     *
     * @param id the task ID
     * @return an Optional containing the task if found, empty otherwise
     */
    Optional<Task> findTaskById(Long id);

    /**
     * Persists a new task or updates an existing one.
     *
     * @param task the task to save
     * @return the saved task (with id populated)
     */
    Task save(Task task);
}
