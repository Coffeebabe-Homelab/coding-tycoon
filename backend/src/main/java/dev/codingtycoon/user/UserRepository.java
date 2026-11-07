package dev.codingtycoon.user;

import java.util.Optional;

/**
 * Port interface for user persistence.
 * Services depend on this interface; Panache-specific code lives in JpaUserRepository.
 */
public interface UserRepository {

    /**
     * Finds a user by their Auth0 subject claim.
     *
     * @param sub the Auth0 sub claim
     * @return an Optional containing the user if found, empty otherwise
     */
    Optional<User> findBySub(String sub);

    /**
     * Persists a new user or updates an existing one.
     *
     * @param user the user to save
     * @return the saved user (with id populated)
     */
    User save(User user);
}
