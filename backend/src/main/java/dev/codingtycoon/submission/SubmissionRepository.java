package dev.codingtycoon.submission;

import java.util.Optional;

/**
 * Port interface for submission persistence.
 * Services depend on this interface; Panache-specific code lives in JpaSubmissionRepository.
 */
public interface SubmissionRepository {

    /**
     * Counts the pushes made for a task, so the next attempt number can be derived.
     *
     * @param taskId the task ID
     * @return the number of submissions, zero if none
     */
    long countForTask(Long taskId);

    /**
     * Returns the task's most recent push, with its files.
     *
     * @param taskId the task ID
     * @return the submission with the highest attempt number, or empty if there is none
     */
    Optional<Submission> findLatestForTask(Long taskId);

    /**
     * Persists a new submission and its files.
     *
     * @param submission the submission to save
     * @return the saved submission (with ids populated)
     */
    Submission save(Submission submission);
}
