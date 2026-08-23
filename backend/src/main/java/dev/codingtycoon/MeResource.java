package dev.codingtycoon;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Map;

/**
 * Returns the authenticated user's identity from the Auth0 JWT.
 * Used by the frontend to confirm the token is valid and to retrieve the user's sub claim.
 */
@Path("/api/me")
@Authenticated
public class MeResource {

    @Inject
    JsonWebToken jwt;

    /**
     * Returns the Auth0 sub claim of the authenticated user.
     * Returns 401 if the request carries no token or an invalid/expired token.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response me() {
        return Response.ok(Map.of("sub", jwt.getSubject())).build();
    }
}
