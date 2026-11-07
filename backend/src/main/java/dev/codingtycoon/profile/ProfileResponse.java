package dev.codingtycoon.profile;

import dev.codingtycoon.topic.TopicResponse;

import java.util.List;

/**
 * JSON response record for a player profile. Returned by all profile endpoints.
 * Topics are fully resolved from IDs to their name/slug representations.
 */
public record ProfileResponse(
        Long id,
        String language,
        String framework,
        String seniority,
        List<TopicResponse> topics
) {

    /**
     * Creates a ProfileResponse from a PlayerProfile entity, mapping all topics.
     *
     * @param profile the profile entity to map
     * @return a new ProfileResponse with resolved topics
     */
    public static ProfileResponse from(PlayerProfile profile) {
        return new ProfileResponse(
                profile.id,
                profile.language,
                profile.framework,
                profile.seniority,
                profile.topics.stream().map(TopicResponse::from).toList()
        );
    }
}
