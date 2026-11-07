package dev.codingtycoon.task;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * REST resource exposing the task API.
 * All endpoints require a valid Bearer token (@Authenticated).
 */
@Path("/api/tasks")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TaskResource {

    @Inject
    TaskService taskService;

    @Inject
    JsonWebToken jwt;

    /**
     * Returns the player's current active task, creating one from a seed task if none exists.
     * Returns 201 Created on first call (task was just created), 200 OK on subsequent calls.
     *
     * @return 201 with task body if just created, 200 with task body if already existed
     */
    @GET
    @Path("/today")
    public Response getTodayTask() {
        String sub = jwt.getSubject();
        Pair<Task, Boolean> result = taskService.getOrCreateTodayTask(sub);
        TaskResponse body = TaskResponse.from(result.first());
        if (result.second()) {
            return Response.status(Response.Status.CREATED).entity(body).build();
        }
        return Response.ok(body).build();
    }

    /**
     * Applies a player's status change to one of their own tasks.
     * Review verdicts (APPROVED, CHANGES_REQUESTED) can't be set here.
     *
     * @param id      the task ID from the path
     * @param request the desired new status
     * @return 200 OK with the updated task, 422 for a transition the player can't make,
     *         404 if the task doesn't exist or belongs to another player
     */
    @PATCH
    @Path("/{id}/status")
    public Response updateStatus(@PathParam("id") Long id, @Valid UpdateTaskStatusRequest request) {
        Task updated = taskService.transitionStatus(jwt.getSubject(), id, request.status);
        return Response.ok(TaskResponse.from(updated)).build();
    }

    /**
     * Generates a new task for the player using the AI port (falling back to seed tasks).
     * Returns 409 Conflict if an active task already exists.
     *
     * @return 201 Created with the new task body, or 409 if a task already exists
     */
    @POST
    @Path("/generate")
    public Response generateTask() {
        String sub = jwt.getSubject();
        Task task = taskService.generateTask(sub);
        return Response.status(Response.Status.CREATED).entity(TaskResponse.from(task)).build();
    }
}
