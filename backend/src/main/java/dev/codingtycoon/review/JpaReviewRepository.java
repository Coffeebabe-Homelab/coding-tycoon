package dev.codingtycoon.review;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

/**
 * Panache adapter implementing the ReviewRepository port.
 * All Panache/JPA-specific code is confined here — services never see it.
 */
@ApplicationScoped
public class JpaReviewRepository implements ReviewRepository, PanacheRepository<Review> {

    @Override
    public Optional<Review> findBySubmissionId(Long submissionId) {
        return find("submissionId", submissionId).firstResultOptional();
    }

    @Override
    public Optional<Review> findReviewById(Long id) {
        return findByIdOptional(id);
    }

    @Override
    public Review save(Review review) {
        persistAndFlush(review);
        return review;
    }
}
