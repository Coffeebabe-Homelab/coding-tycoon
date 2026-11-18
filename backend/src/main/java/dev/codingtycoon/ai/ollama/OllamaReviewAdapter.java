package dev.codingtycoon.ai.ollama;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.codingtycoon.review.ReviewAiPort;
import dev.codingtycoon.review.ReviewFile;
import dev.codingtycoon.review.ReviewRequest;
import dev.codingtycoon.review.ReviewResult;
import dev.codingtycoon.review.ReviewSettings;
import dev.codingtycoon.review.ReviewVerdict;
import dev.codingtycoon.review.Severity;
import dev.langchain4j.model.chat.ChatModel;
import io.smallrye.faulttolerance.api.TypedGuard;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Typed;
import jakarta.enterprise.util.TypeLiteral;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * {@link ReviewAiPort} backed by a local Ollama model, used when {@code codingtycoon.ai.provider=ollama}.
 * Every failure ends in {@code Optional.empty()}: the worker counts it and retries later, so the
 * player never loses an attempt to it.
 */
@ApplicationScoped
@Typed(OllamaReviewAdapter.class) // AiProviders exposes the selected adapter as the only ReviewAiPort.
public class OllamaReviewAdapter implements ReviewAiPort {

    private static final Logger LOG = Logger.getLogger(OllamaReviewAdapter.class);
    private static final String TEMPLATE = OllamaTaskAdapter.readPrompt("prompts/code-reviewer.txt");
    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{(\\w+)}}");
    /** Rough characters per token for code and English; low on purpose, so the budget errs safe. */
    private static final int CHARS_PER_TOKEN = 3;

    @Inject
    ChatModel chatModel;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    ReviewSettings settings;

    @ConfigProperty(name = "quarkus.langchain4j.ollama.chat-model.num-ctx", defaultValue = "8192")
    int numCtx;

    @ConfigProperty(name = "quarkus.langchain4j.ollama.chat-model.num-predict", defaultValue = "1024")
    int numPredict;

    private TypedGuard<Optional<ReviewResult>> guard;

    /*
     * The timeout is codingtycoon.review.timeout, the same limit the worker applies, so one env var
     * tunes both; this one also ends the HTTP call. Only an unreachable server is retried here. No
     * circuit breaker: the queue's doubling backoff already spaces out calls to a model that is down.
     */
    @PostConstruct
    void buildGuard() {
        guard = TypedGuard.create(new TypeLiteral<Optional<ReviewResult>>() { })
                .withTimeout().duration(settings.timeout().toMillis(), ChronoUnit.MILLIS).done()
                .withRetry().maxRetries(2).delay(1, ChronoUnit.SECONDS).retryOn(AiUnavailableException.class).done()
                .withFallback().handler(this::noReview).done()
                .build();
    }

    @Override
    public Optional<ReviewResult> review(ReviewRequest request) {
        String prompt = prompt(request);
        if (tooLong(prompt)) {
            // A cut prompt would review code the model never saw, so don't send it at all.
            LOG.warnf("Review prompt of %d characters exceeds the %d-token context, not sent", prompt.length(), numCtx);
            return Optional.empty();
        }
        return guard.get(() -> parse(callModel(prompt), request.criteria().size()));
    }

    private Optional<ReviewResult> noReview(Throwable failure) {
        LOG.warnf("AI review failed: %s", failure.toString());
        return Optional.empty();
    }

    private String callModel(String prompt) {
        try {
            return chatModel.chat(prompt);
        } catch (RuntimeException e) {
            throw OllamaTaskAdapter.isUnreachable(e) ? new AiUnavailableException(e) : e;
        }
    }

    boolean tooLong(String prompt) {
        return prompt.length() > (long) CHARS_PER_TOKEN * (numCtx - numPredict);
    }

    /** One pass over the template, so text in the player's code is never taken as a placeholder. */
    String prompt(ReviewRequest request) {
        Map<String, String> values = Map.ofEntries(
                Map.entry("guidelines", request.guidelines()),
                Map.entry("title", request.taskTitle()),
                Map.entry("description", request.taskDescription()),
                Map.entry("criteria", IntStream.range(0, request.criteria().size())
                        .mapToObj(i -> i + ": " + request.criteria().get(i))
                        .collect(Collectors.joining("\n"))),
                Map.entry("originals", files(request.originals(), false)),
                Map.entry("attempt", String.valueOf(request.attemptNumber())),
                Map.entry("pushed", files(request.pushed(), true)),
                Map.entry("criteriaCount", String.valueOf(request.criteria().size())),
                Map.entry("positions", IntStream.range(0, request.criteria().size()).mapToObj(String::valueOf)
                        .collect(Collectors.joining(", "))),
                Map.entry("paths", request.pushed().stream().map(ReviewFile::path).collect(Collectors.joining(", "))));
        Matcher matcher = PLACEHOLDER.matcher(TEMPLATE);
        StringBuilder prompt = new StringBuilder();
        while (matcher.find()) {
            matcher.appendReplacement(prompt, Matcher.quoteReplacement(values.get(matcher.group(1))));
        }
        return matcher.appendTail(prompt).toString();
    }

    private static String files(List<ReviewFile> files, boolean numbered) {
        if (files.isEmpty()) {
            return "(none)";
        }
        return files.stream().map(file -> {
            String[] lines = file.content().split("\n", -1);
            int count = file.lineCount();
            String body = IntStream.range(0, count)
                    .mapToObj(i -> numbered ? (i + 1) + " | " + lines[i] : lines[i])
                    .collect(Collectors.joining("\n"));
            return "BEGIN FILE " + file.path() + "\n" + body + "\nEND FILE " + file.path();
        }).collect(Collectors.joining("\n\n"));
    }

    /**
     * Maps the model's JSON to a result. Checks the shape only; whether paths and lines fit the
     * push is checked again by the worker. Small models drift, so anything off is no result.
     */
    Optional<ReviewResult> parse(String answer, int criteriaCount) {
        try {
            JsonNode json = objectMapper.readTree(OllamaTaskAdapter.stripCodeFence(answer));
            Optional<ReviewVerdict> verdict = enumValue(ReviewVerdict.class, json.path("verdict").asText(""));
            String summary = json.path("summary").asText("").strip();
            Optional<List<ReviewResult.Comment>> comments = comments(json.path("comments"));
            Optional<List<Boolean>> criteria = criteria(json.path("criteria"), criteriaCount);
            if (verdict.isEmpty() || summary.isEmpty() || comments.isEmpty() || criteria.isEmpty()) {
                LOG.warnf("AI review has missing or invalid fields");
                return Optional.empty();
            }
            return Optional.of(new ReviewResult(verdict.get(), summary, comments.get(), criteria.get()));
        } catch (IOException e) {
            LOG.warnf("AI review is not valid JSON: %s", e.getMessage());
            return Optional.empty();
        }
    }

    private static Optional<List<ReviewResult.Comment>> comments(JsonNode array) {
        if (!array.isArray()) {
            return Optional.empty();
        }
        List<ReviewResult.Comment> comments = new ArrayList<>();
        for (JsonNode node : array) {
            Optional<Severity> severity = enumValue(Severity.class, node.path("severity").asText(""));
            String path = node.path("path").asText("").strip();
            if (severity.isEmpty() || path.isEmpty() || !node.path("line").canConvertToInt() || !node.path("line").isNumber()) {
                return Optional.empty();
            }
            comments.add(new ReviewResult.Comment(path, node.path("line").asInt(), severity.get(),
                    node.path("body").asText("").strip()));
        }
        return Optional.of(comments);
    }

    private static Optional<List<Boolean>> criteria(JsonNode array, int count) {
        if (!array.isArray() || array.size() != count) {
            return Optional.empty();
        }
        Boolean[] met = new Boolean[count];
        for (JsonNode node : array) {
            int position = node.path("position").asInt(-1);
            if (position < 0 || position >= count || met[position] != null || !node.path("met").isBoolean()) {
                return Optional.empty();
            }
            met[position] = node.path("met").asBoolean();
        }
        return Optional.of(Arrays.asList(met));
    }

    private static <E extends Enum<E>> Optional<E> enumValue(Class<E> type, String name) {
        return Arrays.stream(type.getEnumConstants()).filter(value -> value.name().equals(name)).findFirst();
    }
}
