package dev.codingtycoon.codebase;

import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Adapter serving codebases stored as static files under resources/codebases/&lt;key&gt;/.
 * Uses index.txt because listing a classpath directory inside a packaged JAR is unreliable.
 */
@ApplicationScoped
public class ClasspathCodebaseRepository implements CodebaseRepository {

    private static final String ROOT = "codebases/";
    private static final String INDEX_FILE = "index.txt";

    // Indexes are immutable at runtime; keys come from the DB, so the cache stays tiny.
    private final Map<String, List<String>> indexCache = new ConcurrentHashMap<>();

    @Override
    public List<String> listFiles(String codebaseKey) {
        return indexCache.computeIfAbsent(codebaseKey, this::loadIndex);
    }

    @Override
    public Optional<String> readFile(String codebaseKey, String path) {
        return readResource(ROOT + codebaseKey + "/" + path);
    }

    private List<String> loadIndex(String codebaseKey) {
        return readResource(ROOT + codebaseKey + "/" + INDEX_FILE)
                .map(text -> text.lines().sorted().toList())
                .orElse(List.of());
    }

    private Optional<String> readResource(String resource) {
        try (InputStream in = Thread.currentThread().getContextClassLoader().getResourceAsStream(resource)) {
            if (in == null) {
                return Optional.empty();
            }
            return Optional.of(new String(in.readAllBytes(), StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read codebase resource " + resource, e);
        }
    }
}
