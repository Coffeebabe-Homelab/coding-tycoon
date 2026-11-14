package dev.codingtycoon.review;

import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Checks a reviewer's answer against the push before it is stored. Small models drift, so an
 * answer that doesn't fit counts as a failure on our side and the review is retried.
 */
public final class ReviewResultValidator {

    private ReviewResultValidator() {
    }

    /**
     * @param request the push that was reviewed
     * @param result  the reviewer's answer
     * @return the first problem found, or empty when the answer can be stored
     */
    public static Optional<String> problem(ReviewRequest request, ReviewResult result) {
        if (result.verdict() == null) {
            return Optional.of("no verdict");
        }
        if (result.summary() == null || result.summary().isBlank()) {
            return Optional.of("no summary");
        }
        if (result.comments() == null || result.criteriaMet() == null) {
            return Optional.of("no comments or criteria list");
        }
        Map<String, ReviewFile> pushed = request.pushed().stream()
                .collect(Collectors.toMap(ReviewFile::path, Function.identity()));
        for (ReviewResult.Comment comment : result.comments()) {
            ReviewFile file = pushed.get(comment.path());
            if (file == null) {
                return Optional.of("comment on a file not pushed: " + comment.path());
            }
            if (comment.line() < 1 || comment.line() > file.lineCount()) {
                return Optional.of("comment line " + comment.line() + " outside " + file.path()
                        + " (" + file.lineCount() + " lines)");
            }
            if (comment.severity() == null || comment.body() == null || comment.body().isBlank()) {
                return Optional.of("comment without severity or body");
            }
        }
        if (result.criteriaMet().size() != request.criteria().size()) {
            return Optional.of(result.criteriaMet().size() + " criteria results for "
                    + request.criteria().size() + " criteria");
        }
        return Optional.empty();
    }
}
