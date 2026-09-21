package dev.codingtycoon.task;

import java.util.List;
import java.util.Optional;

/**
 * Port interface for AI-based task generation.
 * TaskService depends on this interface; adapter implementations (Ollama, stub) live separately.
 * Returns Optional.empty() when the AI is unavailable — caller falls back to seed tasks.
 */
public interface TaskAiPort {

    /**
     * Generates a coding task tailored to the player's language, seniority, and chosen topics.
     *
     * @param language  the player's preferred programming language (e.g. "Java")
     * @param seniority the player's seniority level (e.g. "Junior", "Mid", "Senior")
     * @param topics    list of topic slugs from the player's profile (e.g. ["rest-apis", "crud"])
     * @return an Optional containing the generated task, or empty if generation failed or was skipped
     */
    Optional<GeneratedTask> generate(String language, String seniority, List<String> topics);
}
