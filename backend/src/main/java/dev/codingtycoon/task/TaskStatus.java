package dev.codingtycoon.task;

/**
 * Represents all possible lifecycle states of a Task.
 * State transitions are enforced by TaskService.transitionStatus().
 */
public enum TaskStatus {
    /** Task has been created and assigned to the player but not yet started. */
    ASSIGNED,
    /** Player has started working on the task. */
    IN_PROGRESS,
    /** Player has submitted their work for review. */
    SUBMITTED,
    /** The AI reviewer has approved the submission — terminal state. */
    APPROVED,
    /** The AI reviewer has requested changes; the player must resubmit. */
    CHANGES_REQUESTED
}
