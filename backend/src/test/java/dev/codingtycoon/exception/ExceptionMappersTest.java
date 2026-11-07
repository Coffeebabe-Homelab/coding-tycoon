package dev.codingtycoon.exception;

import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Covers paths the HTTP tests can't reach: exceptions without a message. */
class ExceptionMappersTest {

    private final ExceptionMappers mappers = new ExceptionMappers();

    @Test
    void constraintViolationWithoutMessageHasEmptyMessage() {
        assertBody(mappers.mapConstraintViolation(new ConstraintViolationException(null, Set.of())),
                422, "ConstraintViolationException", "");
    }

    @Test
    void unprocessableWithoutMessageHasEmptyMessage() {
        assertBody(mappers.mapUnprocessable(new UnprocessableException(null)), 422, "UnprocessableException", "");
    }

    @Test
    void conflictWithoutMessageHasEmptyMessage() {
        assertBody(mappers.mapConflict(new ConflictException(null)), 409, "ConflictException", "");
    }

    private void assertBody(Response response, int status, String error, String message) {
        assertEquals(status, response.getStatus());
        assertEquals(Map.of("error", error, "message", message, "status", status), response.getEntity());
    }
}
