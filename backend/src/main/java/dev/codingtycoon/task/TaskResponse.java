package dev.codingtycoon.task;

import java.util.Arrays;
import java.util.List;

/**
 * JSON response record for a task. Returned by all task endpoints.
 * Converts the comma-separated tags string into a proper list.
 */
public record TaskResponse(
        Long id,
        String title,
        String description,
        String acceptanceCriteria,
        String difficulty,
        List<String> tags,
        String status,
        String createdAt
) {

    /**
     * Creates a TaskResponse from a Task entity, splitting tags from comma-separated format.
     *
     * @param task the Task entity to map
     * @return a new TaskResponse with tags parsed into a list
     */
    public static TaskResponse from(Task task) {
        List<String> tagList = Arrays.stream(task.tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        return new TaskResponse(
                task.id,
                task.title,
                task.description,
                task.acceptanceCriteria,
                task.difficulty,
                tagList,
                task.status.name(),
                task.createdAt.toString()
        );
    }
}
