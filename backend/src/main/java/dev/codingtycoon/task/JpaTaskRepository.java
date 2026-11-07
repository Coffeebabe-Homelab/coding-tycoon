package dev.codingtycoon.task;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

/**
 * Panache adapter implementing the TaskRepository port.
 * All Panache/JPA-specific code is confined here — services never see it.
 */
@ApplicationScoped
public class JpaTaskRepository implements TaskRepository, PanacheRepository<Task> {

    /**
     * Returns the most recent non-APPROVED task for the given player profile.
     * Uses JPQL ordering to guarantee the latest task is returned first.
     */
    @Override
    public Optional<Task> findTodayForProfile(Long profileId) {
        return find(
                "playerProfileId = ?1 AND status != ?2 ORDER BY createdAt DESC",
                profileId,
                TaskStatus.APPROVED
        ).firstResultOptional();
    }

    @Override
    public Optional<Task> findTaskById(Long id) {
        return findByIdOptional(id);
    }

    @Override
    public Task save(Task task) {
        persistAndFlush(task);
        return task;
    }
}
