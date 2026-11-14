package dev.codingtycoon.review;

import java.util.Optional;

/**
 * Port interface for review persistence.
 * Services depend on this interface; Panache-specific code lives in JpaReviewRepository.
 */
public interface ReviewRepository {

    /**
     * Returns the review of a push.
     *
     * @param submissionId the submission ID
     * @return the review, or empty if the push has none
     */
    Optional<Review> findBySubmissionId(Long submissionId);

    /**
     * Returns a review by ID.
     *
     * @param id the review ID
     * @return the review, or empty if none exists
     */
    Optional<Review> findReviewById(Long id);

    /**
     * Persists a new review, or the changes to an existing one, with its comments and criteria.
     *
     * @param review the review to save
     * @return the saved review (with ids populated)
     */
    Review save(Review review);
}
