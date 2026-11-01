package dev.codingtycoon.task.seed;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SeedTaskServiceTest {

    private final SeedTaskService seedTaskService = new SeedTaskService();

    @Test
    void matchingTopicReturnsTaggedSeed() {
        var seed = seedTaskService.getForTopics(List.of("git-workflow"));

        assertTrue(Stream.of(seed.tags()).anyMatch("git-workflow"::equals));
    }

    @Test
    void missingTopicFallsBackToKnownSeed() {
        var seed = seedTaskService.getForTopics(List.of("unknown-topic"));

        assertTrue(seedTaskService.getAll().contains(seed));
    }

    @Test
    void emptyTopicsFallBackToKnownSeed() {
        assertTrue(seedTaskService.getAll().contains(seedTaskService.getForTopics(List.of())));
        assertTrue(seedTaskService.getAll().contains(seedTaskService.getForTopics(null)));
    }

    @Test
    void everySeedBelongsToShopfront() {
        seedTaskService.getAll().forEach(seed -> assertEquals("shopfront", seed.codebaseKey()));
    }

    @Test
    void atLeastThreeSeedsHaveFocusFiles() {
        long withFocus = seedTaskService.getAll().stream()
                .filter(seed -> seed.focusFiles().length > 0)
                .count();

        assertTrue(withFocus >= 3, "expected >= 3 seeds with focus files, got " + withFocus);
    }

    @Test
    void focusFilesExistInIndexAndAreMentionedInDescription() throws IOException {
        List<String> index = readShopfrontIndex();

        for (SeedTask seed : seedTaskService.getAll()) {
            for (String file : seed.focusFiles()) {
                assertTrue(index.contains(file), "not in index.txt: " + file);
                String className = file.substring(file.lastIndexOf('/') + 1).replace(".java", "");
                assertTrue(seed.description().contains(className),
                        seed.title() + " does not mention " + className);
            }
        }
    }

    private List<String> readShopfrontIndex() throws IOException {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("codebases/shopfront/index.txt")) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8).lines().toList();
        }
    }
}
