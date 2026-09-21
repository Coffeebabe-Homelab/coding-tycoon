package dev.codingtycoon.exception;

import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;

import java.util.Map;

/**
 * Central exception mapper that converts known exceptions to structured JSON error responses.
 * All error responses follow the format: {"error": "TypeName", "message": "...", "status": N}.
 */
@Provider
public class ExceptionMappers {

    private static final Logger LOG = Logger.getLogger(ExceptionMappers.class);

    /**
     * Maps ConstraintViolationException (bean validation failures) to 422 Unprocessable Entity.
     */
    @ServerExceptionMapper
    public Response mapConstraintViolation(ConstraintViolationException e) {
        LOG.warn("Validation failure: " + e.getMessage());
        return Response.status(422)
                .entity(Map.of(
                        "error", "ConstraintViolationException",
                        "message", e.getMessage() != null ? e.getMessage() : "",
                        "status", 422
                ))
                .build();
    }

    /**
     * Maps NotFoundException to 404 Not Found.
     */
    @ServerExceptionMapper
    public Response mapNotFound(NotFoundException e) {
        LOG.warn("Resource not found: " + e.getMessage());
        return buildResponse(Response.Status.NOT_FOUND, "NotFoundException", e.getMessage());
    }

    /**
     * Maps UnprocessableException to 422 Unprocessable Entity.
     * Used for semantic errors such as invalid state machine transitions.
     */
    @ServerExceptionMapper
    public Response mapUnprocessable(UnprocessableException e) {
        LOG.warn("Unprocessable: " + e.getMessage());
        return Response.status(422)
                .entity(Map.of(
                        "error", "UnprocessableException",
                        "message", e.getMessage() != null ? e.getMessage() : "",
                        "status", 422
                ))
                .build();
    }

    /**
     * Maps ConflictException to 409 Conflict.
     */
    @ServerExceptionMapper
    public Response mapConflict(ConflictException e) {
        LOG.warn("Conflict: " + e.getMessage());
        return buildResponse(Response.Status.CONFLICT, "ConflictException", e.getMessage());
    }

    /**
     * Fallback mapper for any unhandled RuntimeException — returns 500 Internal Server Error.
     */
    @ServerExceptionMapper
    public Response mapRuntimeException(RuntimeException e) {
        LOG.error("Unexpected error", e);
        return buildResponse(Response.Status.INTERNAL_SERVER_ERROR, "InternalServerError", "An unexpected error occurred");
    }

    private Response buildResponse(Response.Status status, String errorType, String message) {
        return Response.status(status)
                .entity(Map.of(
                        "error", errorType,
                        "message", message != null ? message : "",
                        "status", status.getStatusCode()
                ))
                .build();
    }
}
