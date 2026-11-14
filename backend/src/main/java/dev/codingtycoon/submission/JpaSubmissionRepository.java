package dev.codingtycoon.submission;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

/**
 * Panache adapter implementing the SubmissionRepository port.
 * All Panache/JPA-specific code is confined here — services never see it.
 */
@ApplicationScoped
public class JpaSubmissionRepository implements SubmissionRepository, PanacheRepository<Submission> {

    @Override
    public long countForTask(Long taskId) {
        return count("taskId", taskId);
    }

    @Override
    public Optional<Submission> findLatestForTask(Long taskId) {
        return find("taskId", Sort.descending("attemptNumber"), taskId).firstResultOptional();
    }

    @Override
    public Optional<Submission> findSubmissionById(Long id) {
        return findByIdOptional(id);
    }

    @Override
    public Submission save(Submission submission) {
        persistAndFlush(submission);
        return submission;
    }
}
