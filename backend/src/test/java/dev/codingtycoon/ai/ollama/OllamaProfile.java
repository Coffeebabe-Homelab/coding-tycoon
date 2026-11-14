package dev.codingtycoon.ai.ollama;

import io.quarkus.test.junit.QuarkusTestProfile;

import java.util.Map;

/** Selects the Ollama adapter with short limits. The model itself is mocked; no Ollama runs. */
public class OllamaProfile implements QuarkusTestProfile {

    private static final String GENERATE = "dev.codingtycoon.ai.ollama.OllamaTaskAdapter/generate";

    @Override
    public Map<String, String> getConfigOverrides() {
        return Map.of(
                "codingtycoon.ai.provider", "ollama",
                GENERATE + "/Timeout/value", "1",
                GENERATE + "/Retry/delay", "0",
                // Keep the breaker closed, so one test's failures can't change another's result.
                GENERATE + "/CircuitBreaker/enabled", "false");
    }
}
