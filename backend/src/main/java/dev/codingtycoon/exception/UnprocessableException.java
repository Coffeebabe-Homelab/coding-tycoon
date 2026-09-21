package dev.codingtycoon.exception;

/**
 * Thrown when a request is semantically invalid — the input was understood but cannot be processed.
 * For example: an invalid task state transition.
 * Mapped to HTTP 422 Unprocessable Entity by ExceptionMappers.
 */
public class UnprocessableException extends RuntimeException {

    public UnprocessableException(String message) {
        super(message);
    }
}
