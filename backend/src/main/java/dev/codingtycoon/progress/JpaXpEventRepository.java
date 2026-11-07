package dev.codingtycoon.progress;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

/**
 * Panache adapter implementing the XpEventRepository port.
 * All Panache/JPA-specific code is confined here — services never see it.
 */
@ApplicationScoped
public class JpaXpEventRepository implements XpEventRepository, PanacheRepository<XpEvent> {

    @Override
    public boolean exists(Long taskId, XpReason reason) {
        return count("taskId = ?1 AND reason = ?2", taskId, reason) > 0;
    }

    @Override
    public List<XpEvent> listForProfile(Long profileId) {
        return list("playerProfileId", profileId);
    }

    @Override
    public XpEvent save(XpEvent event) {
        persistAndFlush(event);
        return event;
    }
}
