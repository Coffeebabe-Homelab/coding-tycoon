package dev.codingtycoon.task;

import jakarta.validation.constraints.NotNull;

/**
 * Request body for PATCH /api/tasks/{id}/status.
 * Carries the desired new status for a task.
 */
public class UpdateTaskStatusRequest {

    /** The target status to transition the task into. Must not be null. */
    @NotNull(message = "status must not be null")
    public TaskStatus status;
}
