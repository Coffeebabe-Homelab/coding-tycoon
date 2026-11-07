package dev.codingtycoon.exception;

/**
 * Thrown when a resource already exists and a duplicate creation is attempted.
 * Mapped to HTTP 409 Conflict by ExceptionMappers.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
