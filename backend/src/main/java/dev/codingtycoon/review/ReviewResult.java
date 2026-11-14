package dev.codingtycoon.review;

import java.util.List;

/**
 * The reviewer's answer, before it is checked against the push and stored.
 *
 * @param verdict     approve or ask for changes
 * @param summary     one line for the verdict card
 * @param comments    comments anchored to pushed files
 * @param criteriaMet whether each acceptance criterion is met, in the task's order
 */
public record ReviewResult(
        ReviewVerdict verdict,
        String summary,
        List<Comment> comments,
        List<Boolean> criteriaMet
) {

    /**
     * One comment on a pushed file.
     *
     * @param path     a pushed file's path
     * @param line     1-based line in that file
     * @param severity must fix, suggestion or praise
     * @param body     the comment text
     */
    public record Comment(String path, int line, Severity severity, String body) {}
}
