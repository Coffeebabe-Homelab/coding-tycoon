package dev.codingtycoon.profile;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

/**
 * Panache adapter implementing the ProfileRepository port.
 * All Panache/JPA-specific code is confined here — services never see it.
 */
@ApplicationScoped
public class JpaProfileRepository implements ProfileRepository, PanacheRepository<PlayerProfile> {

    @Override
    public Optional<PlayerProfile> findByUserId(Long userId) {
        return find("userId", userId).firstResultOptional();
    }

    @Override
    public PlayerProfile save(PlayerProfile profile) {
        // persistAndFlush ensures the entity gets an ID and is visible within the same transaction.
        persistAndFlush(profile);
        return profile;
    }
}
