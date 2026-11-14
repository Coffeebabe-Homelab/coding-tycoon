package dev.codingtycoon.review;

import dev.codingtycoon.progress.JpaXpEventRepository;
import dev.codingtycoon.progress.ProgressTestData;
import dev.codingtycoon.review.ReviewResult.Comment;
import dev.codingtycoon.submission.Submission;
import dev.codingtycoon.task.JpaTaskRepository;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskStatus;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The steps the worker runs for one claimed review, on a real database. */
@QuarkusTest
class ReviewServiceProcessingTest {

    private static final String SUB = "auth0|review-processing";
    private static final String FOCUS = "src/main/java/com/shopfront/user/UserService.java";

    @Inject
    ReviewService reviewService;

    @Inject
    ReviewQueue reviewQueue;

    @Inject
    ReviewSettings settings;

    @Inject
    ReviewTestData testData;

    @Inject
    ProgressTestData progressTestData;

    @Inject
    JpaTaskRepository taskRepository;

    @Inject
    JpaXpEventRepository xpEventRepository;

    @Inject
    JpaReviewRepository reviewRepository;

    private Task task;

    @BeforeEach
    void setUp() {
        testData.clear();
        Long profileId = progressTestData.createProfile(SUB);
        task = progressTestData.createTask(profileId, "List users", TaskStatus.SUBMITTED);
        QuarkusTransaction.requiringNew().run(() -> {
            Task stored = taskRepository.findById(task.id);
            stored.focusFiles = FOCUS;
            stored.acceptanceCriteria = "Returns 200\nHas a test";
        });
    }

    private ClaimedReview claimedReview(int attempt) {
        Submission push = testData.createPush(task, attempt, FOCUS, "class UserService {\n  void list() {}\n}\n");
        testData.createReview(push.id);
        return reviewQueue.claimNext().orElseThrow();
    }

    private static ReviewResult changesRequested() {
        return new ReviewResult(ReviewVerdict.CHANGES_REQUESTED, "One fix.",
                List.of(new Comment(FOCUS, 2, Severity.MUST_FIX, "Return the users.")), List.of(true, false));
    }

    private TaskStatus taskStatus() {
        return QuarkusTransaction.requiringNew().call(() -> taskRepository.findById(task.id).status);
    }

    @Test
    void theRequestHasTheTaskThePushAndTheOriginals() {
        ReviewRequest request = reviewService.prepare(claimedReview(2));

        assertEquals(2, request.attemptNumber());
        assertEquals("List users", request.taskTitle());
        assertEquals(List.of("Returns 200", "Has a test"), request.criteria());
        assertEquals(List.of(FOCUS), request.pushed().stream().map(ReviewFile::path).toList());
        assertEquals(FOCUS, request.originals().getFirst().path());
        assertTrue(request.originals().getFirst().content().contains("class UserService"));
    }

    @Test
    void successStoresTheReviewAndAppliesTheVerdict() {
        ClaimedReview claimed = claimedReview(1);

        reviewService.succeed(claimed, changesRequested());

        Review review = testData.find(claimed.reviewId());
        assertEquals(ReviewStatus.DONE, review.status);
        assertEquals(ReviewVerdict.CHANGES_REQUESTED, review.verdict);
        assertEquals("One fix.", review.summary);
        assertNotNull(review.reviewedAt);
        assertEquals(1, review.comments.size());
        assertEquals(List.of(true, false), review.criteria.stream().map(c -> c.met).toList());
        assertEquals(TaskStatus.CHANGES_REQUESTED, taskStatus());
        assertEquals(0, xpEventRepository.count());
    }

    @Test
    void approvalOfTheFirstAttemptPaysTheBonus() {
        ClaimedReview claimed = claimedReview(1);

        reviewService.succeed(claimed, new ReviewResult(ReviewVerdict.APPROVED, "Ship it.", List.of(),
                List.of(true, true)));

        assertEquals(TaskStatus.APPROVED, taskStatus());
        assertEquals(2, xpEventRepository.count());
    }

    @Test
    void aFailureIsRetriedLaterWithoutTouchingTheTask() {
        ClaimedReview claimed = claimedReview(1);
        LocalDateTime before = LocalDateTime.now(ZoneOffset.UTC);

        reviewService.fail(claimed, "timeout");

        Review review = testData.find(claimed.reviewId());
        assertEquals(ReviewStatus.PENDING, review.status);
        assertEquals(1, review.failureCount);
        assertNull(review.startedAt);
        assertTrue(!review.nextAttemptAt.isBefore(before.plus(settings.retryBackoff())));
        assertEquals(TaskStatus.SUBMITTED, taskStatus());
    }

    @Test
    void theBackoffDoublesAfterEachFailure() {
        ClaimedReview claimed = claimedReview(1);
        QuarkusTransaction.requiringNew().run(() -> reviewRepository.findById(claimed.reviewId()).failureCount = 1);
        LocalDateTime before = LocalDateTime.now(ZoneOffset.UTC);

        reviewService.fail(claimed, "timeout");

        assertTrue(!testData.find(claimed.reviewId()).nextAttemptAt
                .isBefore(before.plus(settings.retryBackoff().multipliedBy(2))));
    }

    @Test
    void theLastAllowedFailureMakesItFailedAndTheAttemptIsKept() {
        ClaimedReview claimed = claimedReview(1);
        QuarkusTransaction.requiringNew().run(() ->
                reviewRepository.findById(claimed.reviewId()).failureCount = settings.maxFailures() - 1);

        reviewService.fail(claimed, "unavailable");

        Review review = testData.find(claimed.reviewId());
        assertEquals(ReviewStatus.FAILED, review.status);
        assertNull(review.verdict);
        assertEquals(TaskStatus.SUBMITTED, taskStatus());
        assertTrue(reviewQueue.claimNext().isEmpty(), "a FAILED review is off the queue");
    }
}
