package dev.codingtycoon.ai.stub;

import dev.codingtycoon.task.GeneratedTask;
import dev.codingtycoon.task.TaskAiPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Typed;

import java.util.List;
import java.util.Optional;

/**
 * The default {@link TaskAiPort}: makes no AI call and always returns empty, so players get seed
 * tasks. Used in tests, CI and anywhere {@code codingtycoon.ai.provider=stub}.
 */
@ApplicationScoped
@Typed(StubTaskAdapter.class) // AiProviders exposes the selected adapter as the only TaskAiPort.
public class StubTaskAdapter implements TaskAiPort {

    @Override
    public Optional<GeneratedTask> generate(String language, String seniority, List<String> topics) {
        return Optional.empty();
    }
}
