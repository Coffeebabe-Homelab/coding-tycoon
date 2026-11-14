package dev.codingtycoon.review;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;

/**
 * A review as returned by {@code GET /api/reviews/latest}.
 *
 * @param id            review ID
 * @param submissionId  the reviewed push
 * @param attemptNumber the push's attempt number
 * @param status        PENDING, RUNNING, DONE or FAILED
 * @param verdict       set only when DONE
 * @param summary       one line for the verdict card, set only when DONE
 * @param comments      sorted Must fix, Suggestion, Praise, then by path and line
 * @param criteria      which of the task's criteria are met, by position
 * @param createdAt     when the push queued the review, in UTC
 * @param reviewedAt    when the verdict arrived, in UTC
 * @param targetSeconds how long a review usually takes, so the UI can say when it runs late
 */
public record ReviewResponse(Long id, Long submissionId, int attemptNumber, ReviewStatus status,
                             ReviewVerdict verdict, String summary, List<CommentResponse> comments,
                             List<CriterionResponse> criteria, Instant createdAt, Instant reviewedAt,
                             long targetSeconds) {

    private static final Comparator<ReviewComment> COMMENT_ORDER = Comparator
            .comparing((ReviewComment comment) -> comment.severity)
            .thenComparing(comment -> comment.path)
            .thenComparingInt(comment -> comment.line);

    /**
     * One comment, anchored to a line of a pushed file.
     *
     * @param path     codebase-relative path
     * @param line     1-based line in the pushed file
     * @param severity MUST_FIX, SUGGESTION or PRAISE
     * @param body     the comment text
     */
    public record CommentResponse(String path, int line, Severity severity, String body) {
    }

    /**
     * Whether one of the task's criteria is met.
     *
     * @param position index in the task's criteria list
     * @param met      true when the reviewer found it met
     */
    public record CriterionResponse(int position, boolean met) {
    }

    /**
     * Maps a review to its response.
     *
     * @param latest        the review and its push's attempt number
     * @param targetSeconds the configured review target
     * @return the response body
     */
    public static ReviewResponse from(LatestReview latest, long targetSeconds) {
        Review review = latest.review();
        List<CommentResponse> comments = review.comments.stream()
                .sorted(COMMENT_ORDER)
                .map(c -> new CommentResponse(c.path, c.line, c.severity, c.body))
                .toList();
        List<CriterionResponse> criteria = review.criteria.stream()
                .map(c -> new CriterionResponse(c.position, c.met))
                .toList();
        return new ReviewResponse(review.id, review.submissionId, latest.attemptNumber(), review.status,
                review.verdict, review.summary, comments, criteria, toInstant(review.createdAt),
                toInstant(review.reviewedAt), targetSeconds);
    }

    private static Instant toInstant(LocalDateTime utc) {
        return utc == null ? null : utc.toInstant(ZoneOffset.UTC);
    }
}
