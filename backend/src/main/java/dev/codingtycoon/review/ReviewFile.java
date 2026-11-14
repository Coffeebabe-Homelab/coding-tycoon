package dev.codingtycoon.review;

/**
 * A whole source file given to the reviewer.
 *
 * @param path    path in the task's codebase
 * @param content the full file content
 */
public record ReviewFile(String path, String content) {

    /** @return the file's line count, at least 1, for checking a comment's line */
    public int lineCount() {
        return Math.max(1, (int) content.lines().count());
    }
}
