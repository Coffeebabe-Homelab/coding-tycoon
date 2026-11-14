package dev.codingtycoon.review.worker;

import dev.codingtycoon.review.ClaimedReview;
import dev.codingtycoon.review.ReviewAiPort;
import dev.codingtycoon.review.ReviewQueue;
import dev.codingtycoon.review.ReviewRequest;
import dev.codingtycoon.review.ReviewResult;
import dev.codingtycoon.review.ReviewResultValidator;
import dev.codingtycoon.review.ReviewService;
import dev.codingtycoon.review.ReviewSettings;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.context.ManagedExecutor;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Runs queued reviews in the background, one at a time per instance: the CPU-only staging host
 * can't run several models at once. More throughput means more instances; the queue never hands
 * the same review to two of them.
 * <p>
 * Depends only on ports and {@link ReviewService}, never on JPA, HTTP or a provider, so it can
 * move to its own service later.
 */
@ApplicationScoped
public class ReviewWorker {

    private static final Logger LOG = Logger.getLogger(ReviewWorker.class);

    private final ReviewQueue queue;
    private final ReviewAiPort reviewer;
    private final ReviewService reviewService;
    private final ReviewSettings settings;
    private final Executor executor;

    @Inject
    ReviewWorker(ReviewQueue queue, ReviewAiPort reviewer, ReviewService reviewService, ReviewSettings settings,
                 ManagedExecutor executor) {
        this(queue, reviewer, reviewService, settings, (Executor) executor);
    }

    ReviewWorker(ReviewQueue queue, ReviewAiPort reviewer, ReviewService reviewService, ReviewSettings settings,
                 Executor executor) {
        this.queue = queue;
        this.reviewer = reviewer;
        this.reviewService = reviewService;
        this.settings = settings;
        this.executor = executor;
    }

    @Scheduled(every = "${codingtycoon.review.poll-interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void poll() {
        runOnce();
    }

    /**
     * Puts back reviews abandoned by a stopped worker, then works on the next due review.
     *
     * @return true if a review was claimed
     */
    public boolean runOnce() {
        int released = queue.releaseStuck(settings.stuckAfter());
        if (released > 0) {
            LOG.warnf("Put back %d review(s) stuck in RUNNING for over %s", released, settings.stuckAfter());
        }
        Optional<ClaimedReview> claimed = queue.claimNext();
        claimed.ifPresent(this::process);
        return claimed.isPresent();
    }

    private void process(ClaimedReview claimed) {
        long start = System.nanoTime();
        Optional<String> failure;
        try {
            failure = review(claimed);
        } catch (RuntimeException e) {
            failure = Optional.of("error: " + e);
        }
        Duration took = Duration.ofNanos(System.nanoTime() - start);
        if (failure.isPresent()) {
            recordFailure(claimed, failure.get());
            return;
        }
        LOG.infof("Review %d done in %d ms", claimed.reviewId(), took.toMillis());
        if (took.compareTo(settings.targetDuration()) > 0) {
            LOG.warnf("Review %d took %s, over the %s target", claimed.reviewId(), took, settings.targetDuration());
        }
    }

    /** @return the reason it failed, or empty once the answer is stored */
    private Optional<String> review(ClaimedReview claimed) {
        ReviewRequest request = reviewService.prepare(claimed);
        Optional<ReviewResult> result;
        try {
            result = callReviewer(request);
        } catch (TimeoutException e) {
            return Optional.of("timeout after " + settings.timeout());
        } catch (ExecutionException e) {
            return Optional.of("reviewer error: " + e.getCause());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.of("interrupted");
        }
        if (result.isEmpty()) {
            return Optional.of("no answer from the reviewer");
        }
        Optional<String> problem = ReviewResultValidator.problem(request, result.get());
        if (problem.isPresent()) {
            return Optional.of("invalid answer: " + problem.get());
        }
        reviewService.succeed(claimed, result.get());
        LOG.infof("Review %d attempt %d: %s", claimed.reviewId(), request.attemptNumber(), result.get().verdict());
        return Optional.empty();
    }

    // Outside any transaction. A call past the timeout is abandoned, not stopped: the adapter's
    // own timeout (P5-04) is what ends the HTTP request to the model.
    private Optional<ReviewResult> callReviewer(ReviewRequest request)
            throws TimeoutException, ExecutionException, InterruptedException {
        CompletableFuture<Optional<ReviewResult>> call =
                CompletableFuture.supplyAsync(() -> reviewer.review(request), executor);
        try {
            return call.get(settings.timeout().toMillis(), TimeUnit.MILLISECONDS);
        } finally {
            call.cancel(true);
        }
    }

    private void recordFailure(ClaimedReview claimed, String reason) {
        try {
            reviewService.fail(claimed, reason);
        } catch (RuntimeException e) {
            // It stays RUNNING, so the stuck check puts it back later.
            LOG.errorf(e, "Could not record the failure of review %d (%s)", claimed.reviewId(), reason);
        }
    }
}
