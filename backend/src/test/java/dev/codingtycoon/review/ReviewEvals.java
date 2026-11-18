package dev.codingtycoon.review;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.codingtycoon.codebase.CodebaseRepository;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.seed.SeedTask;
import dev.codingtycoon.task.seed.SeedTaskService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Runs the review eval cases in {@code evals/review/cases} through whichever {@link ReviewAiPort}
 * the config selects, and prints verdict and latency per case. By hand only: it needs a real model,
 * and CI must not. Start it with {@code evals/review/run.sh}.
 */
@QuarkusTest
@EnabledIfSystemProperty(named = "evals", matches = "true")
class ReviewEvals {

    private static final Path CASES = Path.of("evals/review/cases");

    @Inject
    ReviewAiPort reviewer;

    @Inject
    SeedTaskService seedTaskService;

    @Inject
    CodebaseRepository codebaseRepository;

    @Inject
    ReviewSettings settings;

    @Inject
    ObjectMapper objectMapper;

    @Test
    void runTheEvalCases() throws IOException {
        List<Path> cases;
        try (Stream<Path> dirs = Files.list(CASES)) {
            cases = dirs.filter(Files::isDirectory).sorted().toList();
        }
        StringBuilder report = new StringBuilder("\n| Case | Expected | Got | OK | Seconds | Over target |\n|---|---|---|---|---|---|\n");
        int passed = 0;
        for (Path dir : cases) {
            JsonNode spec = objectMapper.readTree(dir.resolve("case.json").toFile());
            ReviewRequest request = request(spec.path("task").asText(), dir.resolve("files"));
            long start = System.nanoTime();
            Optional<ReviewResult> result = reviewer.review(request);
            Duration took = Duration.ofNanos(System.nanoTime() - start);
            String got = result.map(r -> ReviewResultValidator.problem(request, r)
                    .map(problem -> "INVALID (" + problem + ")")
                    .orElse(r.verdict().name())).orElse("NO ANSWER");
            boolean ok = got.equals(spec.path("expected").asText());
            passed += ok ? 1 : 0;
            report.append("| %s | %s | %s | %s | %.1f | %s |\n".formatted(dir.getFileName(), spec.path("expected").asText(),
                    got, ok ? "yes" : "**no**", took.toMillis() / 1000.0,
                    took.compareTo(settings.targetDuration()) > 0 ? "yes" : "no"));
            result.ifPresent(r -> report.append("|  | summary: ").append(r.summary().replace("|", "/"))
                    .append(" (").append(r.comments().size()).append(" comments) | | | | |\n"));
        }
        report.append("\n").append(passed).append(" of ").append(cases.size()).append(" as expected. Target: ")
                .append(settings.targetDuration()).append("\n");
        System.out.println(report);
    }

    private ReviewRequest request(String taskTitle, Path filesDir) throws IOException {
        SeedTask seed = seedTaskService.getAll().stream().filter(s -> s.title().equals(taskTitle)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No seed task: " + taskTitle));
        Task task = new Task();
        task.acceptanceCriteria = seed.acceptanceCriteria();
        List<ReviewFile> originals = Arrays.stream(seed.focusFiles())
                .flatMap(path -> codebaseRepository.readFile(seed.codebaseKey(), path)
                        .map(content -> new ReviewFile(path, content)).stream())
                .toList();
        List<ReviewFile> pushed;
        try (Stream<Path> files = Files.walk(filesDir)) {
            pushed = files.filter(Files::isRegularFile).sorted()
                    .map(file -> new ReviewFile(filesDir.relativize(file).toString(), read(file)))
                    .toList();
        }
        return new ReviewRequest(1, seed.title(), seed.description(), task.criteriaList(), originals, pushed,
                ReviewService.GUIDELINES);
    }

    private static String read(Path file) {
        try {
            return Files.readString(file);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
