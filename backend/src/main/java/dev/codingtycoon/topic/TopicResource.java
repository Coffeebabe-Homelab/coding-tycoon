package dev.codingtycoon.topic;

import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

/**
 * REST resource exposing the topics API. No authentication required — topics are public data
 * needed to populate the onboarding wizard before the user has a profile.
 */
@Path("/api/topics")
@Produces(MediaType.APPLICATION_JSON)
public class TopicResource {

    @Inject
    TopicService topicService;

    /**
     * Returns all available learning topics.
     * No authentication required; used by the onboarding wizard.
     *
     * @return list of topic responses, HTTP 200
     */
    @GET
    @PermitAll
    public List<TopicResponse> list() {
        return topicService.listAll().stream().map(TopicResponse::from).toList();
    }
}
