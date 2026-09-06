package dev.codingtycoon.topic;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

/**
 * Panache adapter implementing the TopicRepository port.
 * All Panache/JPA-specific code is confined here — services never see it.
 */
@ApplicationScoped
public class JpaTopicRepository implements TopicRepository, PanacheRepository<Topic> {

    @Override
    public List<Topic> listTopics() {
        return listAll();
    }

    @Override
    public List<Topic> listByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        // Using positional parameter syntax compatible with both H2 (test) and PostgreSQL (prod).
        return list("id IN ?1", ids);
    }
}
