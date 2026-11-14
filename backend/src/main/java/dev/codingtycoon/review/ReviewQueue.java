package dev.codingtycoon.review;

import java.time.Duration;
import java.util.Optional;

/**
 * Port for scheduling reviews. The worker only talks to this, so the queue can move from the
 * database to a broker, or the worker to its own service, without changing the review domain.
 */
public interface ReviewQueue {

    /**
     * Schedules a review now. Must be called inside the transaction that stores the push, so a
     * push never exists without its review.
     *
     * @param reviewId the review to schedule
     */
    void enqueue(Long reviewId);

    /**
     * Takes the oldest due review for this worker. Two workers never get the same review.
     *
     * @return the claimed review, or empty if none is due
     */
    Optional<ClaimedReview> claimNext();

    /**
     * Takes a review off the queue for good: it has its verdict.
     *
     * @param reviewId the claimed review
     */
    void complete(Long reviewId);

    /**
     * Puts a claimed review back, due again after the delay. Used after a failure on our side.
     *
     * @param reviewId the claimed review
     * @param delay    how long to wait before it can be claimed again
     */
    void retryLater(Long reviewId, Duration delay);

    /**
     * Puts back reviews whose worker stopped mid-review, such as after a restart.
     *
     * @param runningFor how long a review must have been running to count as stuck
     * @return how many reviews were put back
     */
    int releaseStuck(Duration runningFor);
}
