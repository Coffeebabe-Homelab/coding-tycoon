package dev.codingtycoon.submission;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * REST resource for pushes from the VCS panel. Works only on the caller's active task.
 * All endpoints require a valid Bearer token (@Authenticated).
 */
@Path("/api/submissions")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SubmissionResource {

    @Inject
    SubmissionService submissionService;

    @Inject
    JsonWebToken jwt;

    /**
     * Pushes the changed files for the active task and moves the task to SUBMITTED.
     *
     * @param request the commit message and changed files
     * @return 201 with the stored submission, or 422 with the first problem found
     */
    @POST
    public Response push(CreateSubmissionRequest request) {
        Submission submission = submissionService.push(jwt.getSubject(), request);
        return Response.status(Response.Status.CREATED).entity(SubmissionResponse.from(submission)).build();
    }

    /**
     * Returns the latest push for the active task.
     *
     * @return 200 with the submission, or 204 when there is no active task or no push yet
     */
    @GET
    @Path("/latest")
    public Response latest() {
        return submissionService.findLatest(jwt.getSubject())
                .map(submission -> Response.ok(SubmissionResponse.from(submission)).build())
                .orElseGet(() -> Response.noContent().build());
    }
}
