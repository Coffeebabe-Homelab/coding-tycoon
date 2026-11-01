package dev.codingtycoon.task;

import java.util.Arrays;
import java.util.List;

/**
 * JSON response record for a task. Returned by all task endpoints.
 * Converts the comma-separated tags and focus files into proper lists.
 */
public record TaskResponse(
        Long id,
        String title,
        String description,
        String acceptanceCriteria,
        String difficulty,
        List<String> tags,
        String codebaseKey,
        List<String> focusFiles,
        String status,
        String createdAt
) {

    /**
     * Creates a TaskResponse from a Task entity, splitting comma-separated columns into lists.
     *
     * @param task the Task entity to map
     * @return a new TaskResponse with tags and focus files parsed into lists
     */
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.id,
                task.title,
                task.description,
                task.acceptanceCriteria,
                task.difficulty,
                splitCsv(task.tags),
                task.codebaseKey,
                splitCsv(task.focusFiles),
                task.status.name(),
                task.createdAt.toString()
        );
    }

    private static List<String> splitCsv(String csv) {
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }
}
