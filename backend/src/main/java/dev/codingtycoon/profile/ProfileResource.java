package dev.codingtycoon.profile;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * REST resource exposing the player profile API.
 * All endpoints require a valid Bearer token.
 */
@Path("/api/profile")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProfileResource {

    @Inject
    ProfileService profileService;

    @Inject
    JsonWebToken jwt;

    /**
     * Creates a new player profile for the authenticated user.
     * Also creates the User record if this is the user's first login.
     * Returns 409 if a profile already exists.
     *
     * @param request the profile data including topic IDs
     * @return 201 Created with the full profile, or 409 Conflict
     */
    @POST
    public Response createProfile(@Valid CreateProfileRequest request) {
        String sub = jwt.getSubject();
        String email = jwt.getClaim("email");
        PlayerProfile profile = profileService.createProfile(sub, email, request);
        return Response.status(Response.Status.CREATED).entity(ProfileResponse.from(profile)).build();
    }

    /**
     * Returns the authenticated user's player profile.
     * Returns 404 if no profile has been created yet.
     *
     * @return 200 OK with the profile, or 404 Not Found
     */
    @GET
    public Response getProfile() {
        String sub = jwt.getSubject();
        PlayerProfile profile = profileService.getProfile(sub);
        return Response.ok(ProfileResponse.from(profile)).build();
    }

    /**
     * Updates the authenticated user's player profile.
     * Returns 404 if no profile exists yet.
     *
     * @param request the updated profile data including topic IDs
     * @return 200 OK with the updated profile, or 404 Not Found
     */
    @PUT
    public Response updateProfile(@Valid CreateProfileRequest request) {
        String sub = jwt.getSubject();
        PlayerProfile profile = profileService.updateProfile(sub, request);
        return Response.ok(ProfileResponse.from(profile)).build();
    }
}
