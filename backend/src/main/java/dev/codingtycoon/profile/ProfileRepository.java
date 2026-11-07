package dev.codingtycoon.profile;

import java.util.Optional;

/**
 * Port interface for player profile persistence.
 * Services depend on this interface; Panache-specific code lives in JpaProfileRepository.
 */
public interface ProfileRepository {

    /**
     * Finds the profile for the given user ID.
     *
     * @param userId the ID of the user
     * @return an Optional containing the profile if found, empty otherwise
     */
    Optional<PlayerProfile> findByUserId(Long userId);

    /**
     * Persists a new profile or updates an existing one.
     *
     * @param profile the profile to save
     * @return the saved profile (with id populated)
     */
    PlayerProfile save(PlayerProfile profile);
}
