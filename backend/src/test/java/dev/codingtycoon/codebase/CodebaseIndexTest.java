package dev.codingtycoon.codebase;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Guards against files added to a codebase without an index.txt entry (and vice versa).
 * Reads the source tree because the index is the allow-list the API serves from.
 */
class CodebaseIndexTest {

    private static final Path SHOPFRONT_ROOT = Path.of("src/main/resources/codebases/shopfront");

    @Test
    void shopfrontIndexListsEveryFileSorted() throws IOException {
        // Blank lines are rejected too: the repository serves the index verbatim.
        List<String> indexed = Files.readAllLines(SHOPFRONT_ROOT.resolve("index.txt"));

        assertEquals(filesOnDisk(), indexed);
    }

    private List<String> filesOnDisk() throws IOException {
        try (Stream<Path> paths = Files.walk(SHOPFRONT_ROOT)) {
            return paths.filter(Files::isRegularFile)
                    .map(path -> SHOPFRONT_ROOT.relativize(path).toString().replace('\\', '/'))
                    .filter(path -> !path.equals("index.txt"))
                    .sorted()
                    .toList();
        }
    }
}
