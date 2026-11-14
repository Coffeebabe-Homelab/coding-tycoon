package dev.codingtycoon.review.queue.db;

import dev.codingtycoon.review.ClaimedReview;
import dev.codingtycoon.review.Review;
import dev.codingtycoon.review.ReviewQueue;
import dev.codingtycoon.review.ReviewStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.transaction.Transactional.TxType;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

/**
 * {@link ReviewQueue} on the {@code reviews} table: its status and {@code next_attempt_at} columns
 * are the queue. Restart-safe and needs no broker. If a broker comes later, this table can act as
 * its outbox.
 */
@ApplicationScoped
public class DbReviewQueue implements ReviewQueue {

    @Inject
    EntityManager em;

    @Override
    @Transactional(TxType.MANDATORY)
    public void enqueue(Long reviewId) {
        Review review = require(reviewId);
        review.status = ReviewStatus.PENDING;
        review.nextAttemptAt = now();
    }

    /** SKIP LOCKED: a second worker passes over the row the first one is claiming. */
    @Override
    @Transactional
    public Optional<ClaimedReview> claimNext() {
        @SuppressWarnings("unchecked")
        List<Number> ids = em.createNativeQuery("""
                        SELECT id FROM reviews
                        WHERE status = 'PENDING' AND next_attempt_at <= :now
                        ORDER BY next_attempt_at, id
                        LIMIT 1
                        FOR UPDATE SKIP LOCKED""")
                .setParameter("now", now())
                .getResultList();
        if (ids.isEmpty()) {
            return Optional.empty();
        }
        Review review = require(ids.get(0).longValue());
        review.status = ReviewStatus.RUNNING;
        review.startedAt = now();
        return Optional.of(new ClaimedReview(review.id, review.submissionId));
    }

    @Override
    @Transactional
    public void complete(Long reviewId) {
        Review review = require(reviewId);
        review.status = ReviewStatus.DONE;
        review.reviewedAt = now();
    }

    @Override
    @Transactional
    public void retryLater(Long reviewId, Duration delay) {
        Review review = require(reviewId);
        review.status = ReviewStatus.PENDING;
        review.startedAt = null;
        review.nextAttemptAt = now().plus(delay);
    }

    @Override
    @Transactional
    public int releaseStuck(Duration runningFor) {
        LocalDateTime now = now();
        return em.createQuery("""
                        UPDATE Review r SET r.status = :pending, r.startedAt = null, r.nextAttemptAt = :now
                        WHERE r.status = :running AND r.startedAt <= :cutoff""")
                .setParameter("pending", ReviewStatus.PENDING)
                .setParameter("running", ReviewStatus.RUNNING)
                .setParameter("now", now)
                .setParameter("cutoff", now.minus(runningFor))
                .executeUpdate();
    }

    private Review require(Long reviewId) {
        Review review = em.find(Review.class, reviewId);
        if (review == null) {
            throw new IllegalArgumentException("No review " + reviewId);
        }
        return review;
    }

    private static LocalDateTime now() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }
}
