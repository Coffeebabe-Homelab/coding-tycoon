package dev.codingtycoon.review;

import dev.codingtycoon.submission.SubmissionPushed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

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
}
