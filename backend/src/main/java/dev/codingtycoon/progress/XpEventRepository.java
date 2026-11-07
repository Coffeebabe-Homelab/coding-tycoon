package dev.codingtycoon.progress;

import java.util.List;

/**
 * Port interface for XP ledger persistence.
 * Services depend on this interface; Panache-specific code lives in JpaXpEventRepository.
 */
public interface XpEventRepository {

    /**
     * Checks whether an award already exists for a task and reason.
     *
     * @param taskId the task ID
     * @param reason the award reason
     * @return true if the award was already recorded
     */
    boolean exists(Long taskId, XpReason reason);

    /**
     * Returns every XP event of a player profile.
     *
     * @param profileId the player profile ID
     * @return the profile's events, empty if none
     */
    List<XpEvent> listForProfile(Long profileId);

    /**
     * Persists a new XP event.
     *
     * @param event the event to save
     * @return the saved event (with id populated)
     */
    XpEvent save(XpEvent event);
}
