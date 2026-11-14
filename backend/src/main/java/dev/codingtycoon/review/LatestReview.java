package dev.codingtycoon.review;

/**
 * A review with the attempt number of the push it reviews, which lives on the submission.
 *
 * @param review        the stored review
 * @param attemptNumber the push's attempt number, 1-based
 */
public record LatestReview(Review review, int attemptNumber) {
}
