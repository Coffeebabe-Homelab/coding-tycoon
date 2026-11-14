package dev.codingtycoon.review.worker;

import dev.codingtycoon.review.ClaimedReview;
import dev.codingtycoon.review.ReviewAiPort;
import dev.codingtycoon.review.ReviewFile;
import dev.codingtycoon.review.ReviewQueue;
import dev.codingtycoon.review.ReviewRequest;
import dev.codingtycoon.review.ReviewResult;
import dev.codingtycoon.review.ReviewService;
import dev.codingtycoon.review.ReviewSettings;
import dev.codingtycoon.review.ReviewVerdict;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.startsWith;

/** The worker against mocked ports only: it never needs JPA, HTTP or a provider. */
class ReviewWorkerTest {

    private static final ClaimedReview CLAIMED = new ClaimedReview(7L, 70L);
    private static final ReviewRequest REQUEST = new ReviewRequest(1, "T", "D", List.of("One"), List.of(),
            List.of(new ReviewFile("src/A.java", "a\n")), "");
    private static final ReviewResult VALID = new ReviewResult(ReviewVerdict.APPROVED, "Good.", List.of(), List.of(true));

    private final ReviewQueue queue = Mockito.mock(ReviewQueue.class);
    private final ReviewAiPort reviewer = Mockito.mock(ReviewAiPort.class);
    private final ReviewService reviewService = Mockito.mock(ReviewService.class);
    private ReviewWorker worker;

    private static ReviewSettings settings(Duration target, Duration timeout) {
        return new ReviewSettings() {
            public Duration targetDuration() { return target; }
            public Duration timeout() { return timeout; }
            public int maxFailures() { return 3; }
            public Duration retryBackoff() { return Duration.ofSeconds(30); }
            public Duration stuckAfter() { return Duration.ofMinutes(10); }
            public String pollInterval() { return "off"; }
        };
    }

    private ReviewWorker worker(ReviewSettings settings) {
        return new ReviewWorker(queue, reviewer, reviewService, settings, Executors.newCachedThreadPool());
    }

    @BeforeEach
    void setUp() {
        worker = worker(settings(Duration.ofSeconds(30), Duration.ofSeconds(5)));
        Mockito.when(queue.claimNext()).thenReturn(Optional.of(CLAIMED));
        Mockito.when(reviewService.prepare(CLAIMED)).thenReturn(REQUEST);
    }

    @Test
    void anEmptyQueueDoesNothingButReleaseStuckReviews() {
        Mockito.when(queue.claimNext()).thenReturn(Optional.empty());
        Mockito.when(queue.releaseStuck(Duration.ofMinutes(10))).thenReturn(1);

        assertFalse(worker.runOnce());

        Mockito.verify(queue).releaseStuck(Duration.ofMinutes(10));
        Mockito.verifyNoInteractions(reviewer, reviewService);
    }

    @Test
    void aValidAnswerIsStored() {
        Mockito.when(reviewer.review(REQUEST)).thenReturn(Optional.of(VALID));

        assertTrue(worker.runOnce());

        Mockito.verify(reviewService).succeed(CLAIMED, VALID);
        Mockito.verify(reviewService, Mockito.never()).fail(any(), any());
    }

    @Test
    void aReviewOverTheTargetIsStillStored() {
        worker = worker(settings(Duration.ZERO, Duration.ofSeconds(5)));
        Mockito.when(reviewer.review(REQUEST)).thenReturn(Optional.of(VALID));

        worker.runOnce();

        Mockito.verify(reviewService).succeed(CLAIMED, VALID);
    }

    @Test
    void noAnswerIsAFailure() {
        Mockito.when(reviewer.review(REQUEST)).thenReturn(Optional.empty());

        worker.runOnce();

        Mockito.verify(reviewService).fail(CLAIMED, "no answer from the reviewer");
        Mockito.verify(reviewService, Mockito.never()).succeed(any(), any());
    }

    @Test
    void anAnswerThatDoesNotFitThePushIsAFailure() {
        Mockito.when(reviewer.review(REQUEST)).thenReturn(Optional.of(
                new ReviewResult(ReviewVerdict.APPROVED, "Good.", List.of(), List.of())));

        worker.runOnce();

        Mockito.verify(reviewService).fail(Mockito.eq(CLAIMED), startsWith("invalid answer: "));
    }

    @Test
    void aCallPastTheTimeoutIsAFailure() {
        worker = worker(settings(Duration.ZERO, Duration.ofMillis(50)));
        Mockito.when(reviewer.review(REQUEST)).thenAnswer(invocation -> {
            Thread.sleep(2_000);
            return Optional.of(VALID);
        });

        worker.runOnce();

        Mockito.verify(reviewService).fail(CLAIMED, "timeout after PT0.05S");
        Mockito.verify(reviewService, Mockito.never()).succeed(any(), any());
    }

    @Test
    void anErrorInTheReviewerIsAFailure() {
        Mockito.when(reviewer.review(REQUEST)).thenThrow(new IllegalStateException("boom"));

        worker.runOnce();

        Mockito.verify(reviewService).fail(Mockito.eq(CLAIMED), Mockito.contains("boom"));
    }

    @Test
    void anErrorWhileStoringIsAFailure() {
        Mockito.when(reviewer.review(REQUEST)).thenReturn(Optional.of(VALID));
        Mockito.doThrow(new IllegalStateException("task gone")).when(reviewService).succeed(CLAIMED, VALID);

        worker.runOnce();

        Mockito.verify(reviewService).fail(Mockito.eq(CLAIMED), Mockito.contains("task gone"));
    }

    @Test
    void anErrorWhileRecordingTheFailureLeavesItForTheStuckCheck() {
        Mockito.when(reviewer.review(REQUEST)).thenReturn(Optional.empty());
        Mockito.doThrow(new IllegalStateException("db down")).when(reviewService).fail(any(), any());

        assertTrue(worker.runOnce());
    }

    @Test
    void anInterruptedWorkerRecordsAFailureAndKeepsTheFlag() throws Exception {
        Mockito.when(reviewer.review(REQUEST)).thenAnswer(invocation -> {
            Thread.sleep(2_000);
            return Optional.of(VALID);
        });
        Thread.currentThread().interrupt();

        worker.runOnce();

        assertTrue(Thread.interrupted());
        Mockito.verify(reviewService).fail(CLAIMED, "interrupted");
    }
}
