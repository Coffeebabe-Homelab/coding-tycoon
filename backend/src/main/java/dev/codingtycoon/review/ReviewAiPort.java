package dev.codingtycoon.review;

import java.util.Optional;

/**
 * Port for the AI senior dev. The review domain depends on this interface only; adapters live in
 * {@code ai.<provider>}. Returns empty instead of throwing, so the worker can retry the review
 * without costing the player an attempt.
 */
public interface ReviewAiPort {

    /**
     * Reviews one push against its ticket and the guidelines.
     *
     * @param request the ticket, the original and pushed files, and the guidelines
     * @return the review, or empty if the provider failed or answered with something unusable
     */
    Optional<ReviewResult> review(ReviewRequest request);
}
