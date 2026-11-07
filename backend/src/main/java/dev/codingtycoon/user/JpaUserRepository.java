package dev.codingtycoon.user;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

/**
 * Panache adapter implementing the UserRepository port.
 * All Panache/JPA-specific code is confined here — services never see it.
 */
@ApplicationScoped
public class JpaUserRepository implements UserRepository, PanacheRepository<User> {

    @Override
    public Optional<User> findBySub(String sub) {
        return find("sub", sub).firstResultOptional();
    }

    @Override
    public User save(User user) {
        persist(user);
        return user;
    }
}
