package dev.codingtycoon.ai;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Keeps the AI provider replaceable: LangChain4j and Ollama types may only appear in the provider's
 * own package. Scans the sources, so no extra dependency is needed.
 */
class AiBoundaryTest {

    private static final Path SOURCES = Path.of("src/main/java/dev/codingtycoon");
    private static final Path OLLAMA_PACKAGE = SOURCES.resolve("ai/ollama");
    private static final List<String> PROVIDER_IMPORTS = List.of(
            "import dev.langchain4j.", "import io.quarkiverse.langchain4j.");

    @Test
    void providerTypesStayInTheProviderPackage() throws IOException {
        try (Stream<Path> files = Files.walk(SOURCES)) {
            List<Path> leaks = files
                    .filter(file -> file.toString().endsWith(".java"))
                    .filter(file -> !file.startsWith(OLLAMA_PACKAGE))
                    .filter(AiBoundaryTest::importsAProvider)
                    .toList();

            assertEquals(List.of(), leaks);
        }
    }

    private static boolean importsAProvider(Path file) {
        try (Stream<String> lines = Files.lines(file)) {
            return lines.anyMatch(line -> PROVIDER_IMPORTS.stream().anyMatch(line::startsWith));
        } catch (IOException e) {
            throw new IllegalStateException("Can't read " + file, e);
        }
    }
}
