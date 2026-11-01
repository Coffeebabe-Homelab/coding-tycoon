package com.shopfront.common;

/**
 * Thrown when a requested resource does not exist.
 * GlobalExceptionHandler turns it into a 404 response.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
