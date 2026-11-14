package dev.codingtycoon.review;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** What every {@link ReviewQueue} adapter must do, whatever stores the queue. */
public abstract class ReviewQueueContract {

    protected abstract ReviewQueue queue();

    /** Creates a review for a new push, not yet enqueued, and returns its ID. */
    protected abstract Long newReview();

    /** Runs the work in a transaction, as the push does around enqueue. */
    protected abstract void inTransaction(Runnable work);

    private Long enqueued() {
        Long id = newReview();
        inTransaction(() -> queue().enqueue(id));
        return id;
    }

    private Optional<Long> claimedId() {
        return queue().claimNext().map(ClaimedReview::reviewId);
    }

    @Test
    void anEnqueuedReviewIsClaimedOnce() {
        Long id = enqueued();

        assertEquals(Optional.of(id), claimedId());
        assertEquals(Optional.empty(), claimedId());
    }

    @Test
    void theOldestReviewIsClaimedFirst() {
        Long first = enqueued();
        enqueued();

        assertEquals(Optional.of(first), claimedId());
    }

    @Test
    void aReviewRetriedLaterIsNotClaimedBeforeItsTime() {
        Long id = enqueued();
        claimedId();

        queue().retryLater(id, Duration.ofHours(1));
        assertEquals(Optional.empty(), claimedId());

        queue().retryLater(id, Duration.ZERO);
        assertEquals(Optional.of(id), claimedId());
    }

    @Test
    void aCompletedReviewIsNotClaimedAgain() {
        Long id = enqueued();
        claimedId();

        queue().complete(id);

        assertEquals(Optional.empty(), claimedId());
    }

    @Test
    void aStuckReviewIsPutBack() {
        Long id = enqueued();
        claimedId();

        assertEquals(0, queue().releaseStuck(Duration.ofHours(1)));
        assertEquals(1, queue().releaseStuck(Duration.ZERO));
        assertEquals(Optional.of(id), claimedId());
    }

    @Test
    void twoWorkersNeverClaimTheSameReview() throws Exception {
        enqueued();
        enqueued();
        ExecutorService workers = Executors.newFixedThreadPool(2);
        try {
            Callable<Optional<Long>> claim = this::claimedId;
            List<Future<Optional<Long>>> results = workers.invokeAll(List.of(claim, claim));
            Long a = results.get(0).get().orElseThrow();
            Long b = results.get(1).get().orElseThrow();

            assertNotEquals(a, b);
            assertTrue(claimedId().isEmpty());
        } finally {
            workers.shutdown();
        }
    }
}
