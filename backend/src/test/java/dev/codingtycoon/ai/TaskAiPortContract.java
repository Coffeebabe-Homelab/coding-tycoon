package dev.codingtycoon.ai;

import dev.codingtycoon.task.GeneratedTask;
import dev.codingtycoon.task.TaskAiPort;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * What every {@link TaskAiPort} adapter must do, whatever the provider: return a complete task or
 * empty, and never throw, so TaskService can always fall back to a seed task.
 */
public abstract class TaskAiPortContract {

    /** An adapter whose provider answers normally. */
    protected abstract TaskAiPort healthyAdapter();

    /** An adapter whose provider is down, slow or answers with something unusable. */
    protected abstract TaskAiPort failingAdapter();

    @Test
    void aTaskIsCompleteWhenOneIsReturned() {
        Optional<GeneratedTask> task = healthyAdapter().generate("Java", "Junior", List.of("rest-apis"));

        task.ifPresent(t -> {
            assertFalse(t.title().isBlank());
            assertFalse(t.description().isBlank());
            assertFalse(t.acceptanceCriteria().isBlank());
            assertFalse(t.difficulty().isBlank());
        });
    }

    @Test
    void aFailingProviderGivesEmptyInsteadOfThrowing() {
        assertTrue(failingAdapter().generate("Java", "Junior", List.of("rest-apis")).isEmpty());
    }
}
