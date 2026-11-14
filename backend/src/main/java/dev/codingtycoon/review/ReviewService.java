package dev.codingtycoon.review;

import dev.codingtycoon.codebase.CodebaseRepository;
import dev.codingtycoon.submission.Submission;
import dev.codingtycoon.submission.SubmissionPushed;
import dev.codingtycoon.submission.SubmissionRepository;
import dev.codingtycoon.submission.SubmissionService;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskRepository;
import dev.codingtycoon.task.TaskService;
import dev.codingtycoon.task.TaskStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

/**
 * Domain service for reviews. A review is created for every push and handed to the queue; there is
 * no endpoint that starts one, so nothing outside a push can trigger a model call.
 */
@ApplicationScoped
public class ReviewService {

    private static final Logger LOG = Logger.getLogger(ReviewService.class);

    @Inject
    ReviewRepository reviewRepository;

    @Inject
    ReviewQueue reviewQueue;

    @Inject
    SubmissionService submissionService;

    @Inject
    SubmissionRepository submissionRepository;

    @Inject
    TaskRepository taskRepository;

    @Inject
    TaskService taskService;

    @Inject
    CodebaseRepository codebaseRepository;

    @Inject
    ReviewSettings settings;

    /**
     * Queues the review of a new push. Runs inside the push's transaction: if it fails, the push
     * is rolled back too.
     *
     * @param event the stored push
     */
    void onPush(@Observes SubmissionPushed event) {
        Review review = new Review();
        review.submissionId = event.submissionId();
        reviewRepository.save(review);
        reviewQueue.enqueue(review.id);
        LOG.infof("Queued review %d for submission %d", review.id, event.submissionId());
    }

    /**
     * Returns the review of the player's latest push for their newest task, active or just
     * approved. Only the caller's own pushes are looked up, so no other player's review is visible.
     *
     * @param sub the Auth0 subject claim identifying the player
     * @return the review with its attempt number, or empty if the task has no push yet
     */
    @Transactional
    public Optional<LatestReview> findLatest(String sub) {
        return submissionService.findLatestOfNewestTask(sub)
                .flatMap(push -> reviewRepository.findBySubmissionId(push.id)
                        .map(review -> new LatestReview(review, push.attemptNumber)));
    }

    /**
     * Gathers what the reviewer needs for a claimed review. Short transaction: the reviewer call
     * that follows runs outside it.
     *
     * @param claimed the review a worker took from the queue
     * @return the task, its criteria, the codebase originals of its focus files and the pushed files
     */
    @Transactional
    public ReviewRequest prepare(ClaimedReview claimed) {
        Submission push = requirePush(claimed);
        Task task = requireTask(push);
        List<ReviewFile> originals = task.focusFileList().stream()
                .flatMap(path -> codebaseRepository.readFile(task.codebaseKey, path)
                        .map(content -> new ReviewFile(path, content)).stream())
                .toList();
        List<ReviewFile> pushed = push.files.stream().map(file -> new ReviewFile(file.path, file.content)).toList();
        // The guidelines arrive with the reviewer prompt (P5-04).
        return new ReviewRequest(push.attemptNumber, task.title, task.description, task.criteriaList(),
                originals, pushed, "");
    }

    /**
     * Stores a checked reviewer answer and applies its verdict to the task, all in one
     * transaction: the task never shows a verdict the review doesn't have. Approval pays the XP.
     *
     * @param claimed the review being worked on
     * @param result  an answer that passed {@link ReviewResultValidator}
     */
    @Transactional
    public void succeed(ClaimedReview claimed, ReviewResult result) {
        Review review = requireReview(claimed);
        review.verdict = result.verdict();
        review.summary = result.summary();
        review.comments.clear();
        result.comments().forEach(c -> review.comments.add(ReviewComment.of(c.path(), c.line(), c.severity(), c.body())));
        review.criteria.clear();
        IntStream.range(0, result.criteriaMet().size())
                .forEach(i -> review.criteria.add(ReviewCriterion.of(i, result.criteriaMet().get(i))));
        reviewQueue.complete(review.id);

        Submission push = requirePush(claimed);
        TaskStatus verdict = result.verdict() == ReviewVerdict.APPROVED ? TaskStatus.APPROVED : TaskStatus.CHANGES_REQUESTED;
        taskService.applyReviewVerdict(push.taskId, verdict, push.attemptNumber);
    }

    /**
     * Records a failure on our side (timeout, outage, unusable answer). The review is retried
     * with a doubling backoff, and becomes FAILED after the configured number of failures. The
     * task and the attempt number never change, so the player loses nothing.
     *
     * @param claimed the review being worked on
     * @param reason  why it failed, for the log
     */
    @Transactional
    public void fail(ClaimedReview claimed, String reason) {
        Review review = requireReview(claimed);
        review.failureCount++;
        if (review.failureCount >= settings.maxFailures()) {
            review.status = ReviewStatus.FAILED;
            review.startedAt = null;
            LOG.warnf("Review %d FAILED after %d failures, last: %s", review.id, review.failureCount, reason);
            return;
        }
        Duration delay = settings.retryBackoff().multipliedBy(1L << (review.failureCount - 1));
        reviewQueue.retryLater(review.id, delay);
        LOG.warnf("Review %d failed (%s), retry %d in %s", review.id, reason, review.failureCount, delay);
    }

    private Review requireReview(ClaimedReview claimed) {
        return reviewRepository.findReviewById(claimed.reviewId())
                .orElseThrow(() -> new IllegalStateException("No review " + claimed.reviewId()));
    }

    private Submission requirePush(ClaimedReview claimed) {
        return submissionRepository.findSubmissionById(claimed.submissionId())
                .orElseThrow(() -> new IllegalStateException("No submission " + claimed.submissionId()));
    }

    private Task requireTask(Submission push) {
        return taskRepository.findTaskById(push.taskId)
                .orElseThrow(() -> new IllegalStateException("No task " + push.taskId));
    }
}
