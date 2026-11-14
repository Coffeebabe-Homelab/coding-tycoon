package dev.codingtycoon.submission;

import java.util.List;

/**
 * Body of {@code POST /api/submissions}. Checked by SubmissionService, which returns one clear
 * message per problem rather than a list of constraint violations.
 *
 * @param commitMessage the player's commit message, at most 72 characters
 * @param files         the changed files, each one of the task's focus files
 */
public record CreateSubmissionRequest(String commitMessage, List<FileContent> files) {

    /**
     * One changed file, with its full content.
     *
     * @param path    codebase-relative path
     * @param content the file's full content after the player's edits
     */
    public record FileContent(String path, String content) {
    }
}
