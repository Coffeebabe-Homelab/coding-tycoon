package dev.codingtycoon.ai;

/** The AI behind every AI port, set by {@code codingtycoon.ai.provider}. */
public enum AiProvider {
    /** No AI: ports return empty and the game uses seed content. */
    STUB,
    /** A model served by Ollama: local on the homelab for the MVP. */
    OLLAMA
}
