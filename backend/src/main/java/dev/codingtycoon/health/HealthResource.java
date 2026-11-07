package dev.codingtycoon.health;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

/**
 * Simple health check endpoint. Confirms the application is running.
 * The SmallRye Health extension provides /q/health automatically.
 */
@Path("/api/health")
public class HealthResource {

    /**
     * Returns a simple UP status to confirm the application is running.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response health() {
        return Response.ok(Map.of("status", "UP")).build();
    }
}
