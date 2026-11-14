package dev.codingtycoon.review.worker;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Keeps the worker movable to its own service: it talks to ports only, never to the database,
 * HTTP or an AI provider directly.
 */
class WorkerBoundaryTest {

    private static final Path WORKER_PACKAGE = Path.of("src/main/java/dev/codingtycoon/review/worker");
    private static final List<String> FORBIDDEN_IMPORTS = List.of(
            "import jakarta.persistence.", "import io.quarkus.hibernate.", "import jakarta.transaction.",
            "import jakarta.ws.rs.", "import dev.codingtycoon.ai.", "import dev.langchain4j.");

    @Test
    void theWorkerImportsNoPersistenceHttpOrProvider() throws IOException {
        try (Stream<Path> files = Files.walk(WORKER_PACKAGE)) {
            List<String> leaks = files
                    .filter(file -> file.toString().endsWith(".java"))
                    .flatMap(WorkerBoundaryTest::forbiddenImports)
                    .toList();

            assertEquals(List.of(), leaks);
        }
    }

    private static Stream<String> forbiddenImports(Path file) {
        try {
            return Files.readAllLines(file).stream()
                    .filter(line -> FORBIDDEN_IMPORTS.stream().anyMatch(line::startsWith))
                    .map(line -> file.getFileName() + ": " + line);
        } catch (IOException e) {
            throw new IllegalStateException("Can't read " + file, e);
        }
    }
}
