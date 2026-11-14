package dev.codingtycoon.ai;

import dev.codingtycoon.ai.stub.StubTaskAdapter;
import dev.codingtycoon.task.TaskAiPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Picks the adapter for each AI port from {@code codingtycoon.ai.provider} at runtime, so one image
 * runs everywhere. A new provider is a package under {@code ai}, an {@link AiProvider} value and a
 * case here. An unknown value fails at startup.
 */
@ApplicationScoped
public class AiProviders {

    @ConfigProperty(name = "codingtycoon.ai.provider", defaultValue = "stub")
    AiProvider provider;

    @Produces
    @ApplicationScoped
    TaskAiPort taskAiPort(StubTaskAdapter stub) {
        return switch (provider) {
            case STUB -> stub;
        };
    }
}
