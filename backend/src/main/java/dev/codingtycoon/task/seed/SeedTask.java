package dev.codingtycoon.task.seed;

/**
 * Immutable data record representing a pre-defined seed task.
 * Used by SeedTaskService to populate tasks when AI generation is unavailable.
 * focusFiles are paths listed in the codebase index.txt.
 */
public record SeedTask(
        String title,
        String description,
        String acceptanceCriteria,
        String difficulty,
        String[] tags,
        String codebaseKey,
        String[] focusFiles
) {}
