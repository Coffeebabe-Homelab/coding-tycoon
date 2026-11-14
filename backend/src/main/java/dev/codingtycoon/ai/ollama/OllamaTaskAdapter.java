package dev.codingtycoon.ai.ollama;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.codingtycoon.task.GeneratedTask;
import dev.codingtycoon.task.TaskAiPort;
import dev.langchain4j.model.chat.ChatModel;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Typed;
import jakarta.inject.Inject;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.eclipse.microprofile.faulttolerance.Fallback;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.eclipse.microprofile.faulttolerance.Timeout;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.ConnectException;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.StreamSupport;

/**
 * {@link TaskAiPort} backed by a local Ollama model, used when {@code codingtycoon.ai.provider=ollama}.
 * Every failure ends in {@code Optional.empty()}, so the player gets a seed task instead of an error.
 */
@ApplicationScoped
@Typed(OllamaTaskAdapter.class) // AiProviders exposes the selected adapter as the only TaskAiPort.
public class OllamaTaskAdapter implements TaskAiPort {

    private static final Logger LOG = Logger.getLogger(OllamaTaskAdapter.class);
    private static final String PROMPT = readPrompt("prompts/task-generator.txt");

    @Inject
    ChatModel chatModel;

    @Inject
    ObjectMapper objectMapper;

    /*
     * The timeout stays under nginx's 60 s proxy timeout. Only an unreachable server is retried:
     * retrying a slow model only adds load to a CPU that is already busy. Both are tunable in
     * application.properties through the MicroProfile Fault Tolerance keys.
     */
    @Override
    @Timeout(value = 50, unit = ChronoUnit.SECONDS)
    @Retry(maxRetries = 2, delay = 1, delayUnit = ChronoUnit.SECONDS, retryOn = AiUnavailableException.class)
    @CircuitBreaker(requestVolumeThreshold = 4, failureRatio = 0.75, delay = 60, delayUnit = ChronoUnit.SECONDS)
    @Fallback(fallbackMethod = "noTask")
    public Optional<GeneratedTask> generate(String language, String seniority, List<String> topics) {
        String answer = callModel(PROMPT
                .replace("{{language}}", language)
                .replace("{{seniority}}", seniority)
                .replace("{{topics}}", String.join(", ", topics)));
        return parse(answer);
    }

    Optional<GeneratedTask> noTask(String language, String seniority, List<String> topics, Throwable failure) {
        LOG.warnf("AI task generation failed, using a seed task: %s", failure.toString());
        return Optional.empty();
    }

    private String callModel(String prompt) {
        try {
            return chatModel.chat(prompt);
        } catch (RuntimeException e) {
            throw isUnreachable(e) ? new AiUnavailableException(e) : e;
        }
    }

    /** Small models drift from the requested format, so anything incomplete counts as no task. */
    Optional<GeneratedTask> parse(String answer) {
        try {
            JsonNode json = objectMapper.readTree(stripCodeFence(answer));
            String title = text(json, "title");
            String description = text(json, "description");
            String criteria = text(json, "acceptanceCriteria");
            String difficulty = text(json, "difficulty");
            JsonNode tags = json.path("tags");
            if (title.isBlank() || description.isBlank() || criteria.isBlank() || difficulty.isBlank()
                    || !tags.isArray()) {
                LOG.warnf("AI task is missing fields, using a seed task");
                return Optional.empty();
            }
            String[] tagValues = StreamSupport.stream(tags.spliterator(), false)
                    .map(JsonNode::asText)
                    .toArray(String[]::new);
            return Optional.of(new GeneratedTask(title, description, criteria, difficulty, tagValues));
        } catch (IOException e) {
            LOG.warnf("AI task is not valid JSON, using a seed task: %s", e.getMessage());
            return Optional.empty();
        }
    }

    private static String text(JsonNode json, String field) {
        return json.path(field).asText("").strip();
    }

    private static String stripCodeFence(String answer) {
        String trimmed = answer.strip();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }
        int start = trimmed.indexOf('\n') + 1;
        int end = trimmed.lastIndexOf("```");
        return end > start ? trimmed.substring(start, end) : trimmed;
    }

    private static boolean isUnreachable(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof ConnectException || cause instanceof UnknownHostException) {
                return true;
            }
        }
        return false;
    }

    private static String readPrompt(String resource) {
        try (InputStream in = Thread.currentThread().getContextClassLoader().getResourceAsStream(resource)) {
            if (in == null) {
                throw new IllegalStateException("Missing prompt " + resource);
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
