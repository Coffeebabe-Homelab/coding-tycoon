package dev.codingtycoon.ai.ollama;

/** The model server can't be reached. The only AI failure worth retrying: a slow model is not retried. */
public class AiUnavailableException extends RuntimeException {

    public AiUnavailableException(Throwable cause) {
        super("AI provider unreachable", cause);
    }
}
