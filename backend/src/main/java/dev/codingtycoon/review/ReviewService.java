package dev.codingtycoon.review;

import dev.codingtycoon.submission.SubmissionPushed;
import dev.codingtycoon.submission.SubmissionService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.Optional;

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
}
