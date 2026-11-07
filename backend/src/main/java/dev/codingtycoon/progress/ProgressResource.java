package dev.codingtycoon.progress;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * REST resource exposing the player's progression (XP).
 * Requires a valid Bearer token.
 */
@Path("/api/progress")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class ProgressResource {

    @Inject
    ProgressService progressService;

    @Inject
    JsonWebToken jwt;

    /**
     * Returns the authenticated player's progress.
     *
     * @return 200 with the progress body, 401 without a token, 404 if the player has no profile
     */
    @GET
    public ProgressResponse getProgress() {
        return progressService.getProgress(jwt.getSubject());
    }
}
