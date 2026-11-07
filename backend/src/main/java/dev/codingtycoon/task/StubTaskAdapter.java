package dev.codingtycoon.task;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

/**
 * Stub implementation of TaskAiPort.
 * Always returns Optional.empty() — used until the real Ollama adapter is implemented in Phase 3.
 * TaskService falls back to SeedTaskService when this returns empty.
 */
@ApplicationScoped
public class StubTaskAdapter implements TaskAiPort {

    /**
     * Stub implementation — always returns empty. No AI call is made.
     *
     * @param language  ignored
     * @param seniority ignored
     * @param topics    ignored
     * @return Optional.empty() always
     */
    @Override
    public Optional<GeneratedTask> generate(String language, String seniority, List<String> topics) {
        return Optional.empty();
    }
}
