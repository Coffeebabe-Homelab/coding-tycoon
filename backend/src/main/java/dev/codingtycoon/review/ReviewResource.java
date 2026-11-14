package dev.codingtycoon.review;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * REST resource for the Review tab. Reviews are created by pushes only, so it just reads them.
 * All endpoints require a valid Bearer token (@Authenticated).
 */
@Path("/api/reviews")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class ReviewResource {

    @Inject
    ReviewService reviewService;

    @Inject
    JsonWebToken jwt;

    @Inject
    ReviewSettings settings;

    /**
     * Returns the review of the latest push for the player's newest task. The Review tab polls it
     * while the review is PENDING or RUNNING.
     *
     * @return 200 with the review, or 204 when the task has no push yet
     */
    @GET
    @Path("/latest")
    public Response latest() {
        return reviewService.findLatest(jwt.getSubject())
                .map(latest -> Response.ok(ReviewResponse.from(latest, settings.targetDuration().toSeconds())).build())
                .orElseGet(() -> Response.noContent().build());
    }

    /**
     * Puts a FAILED review back in the queue (the "Retry" on Screen 11b). It runs no model call
     * itself: the worker picks the review up.
     *
     * @param id the review ID
     * @return 200 with the PENDING review; 404 if it isn't the caller's; 422 if it isn't FAILED
     */
    @POST
    @Path("/{id}/retry")
    public ReviewResponse retry(@PathParam("id") Long id) {
        return ReviewResponse.from(reviewService.retry(jwt.getSubject(), id), settings.targetDuration().toSeconds());
    }
}
