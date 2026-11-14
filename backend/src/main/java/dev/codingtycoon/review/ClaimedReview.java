package dev.codingtycoon.review;

/**
 * A review a worker has taken from the queue. Only ids: the worker loads what it needs.
 *
 * @param reviewId     the review to run
 * @param submissionId the push it reviews
 */
public record ClaimedReview(Long reviewId, Long submissionId) {}
