package dev.codingtycoon.codebase;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Read-only REST resource for the codebase of the player's active task.
 * Only GET endpoints exist, so writes are rejected server-side with 405.
 */
@Path("/api/codebase")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class CodebaseResource {

    @Inject
    CodebaseService codebaseService;

    @Inject
    JsonWebToken jwt;

    /**
     * Lists every file of the active task's codebase.
     *
     * @return 200 with codebase key, focus files and a flat sorted file list; 404 if there is no active task
     */
    @GET
    @Path("/files")
    public CodebaseFilesResponse listFiles() {
        return codebaseService.listFiles(jwt.getSubject());
    }

    /**
     * Returns the content of one file.
     *
     * @param path codebase-relative path (may contain slashes)
     * @return 200 with path and content; 404 if the path is not in the codebase index
     */
    @GET
    @Path("/files/{path: .+}")
    public CodebaseFileResponse readFile(@PathParam("path") String path) {
        return codebaseService.readFile(jwt.getSubject(), path);
    }
}
