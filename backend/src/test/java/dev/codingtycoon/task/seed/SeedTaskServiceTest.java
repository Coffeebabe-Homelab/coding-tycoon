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

    // The player can edit only focus files (Phase 4), so a seed without them can't be played.
    @Test
    void everySeedHasFocusFiles() {
        for (SeedTask seed : seedTaskService.getAll()) {
            assertTrue(seed.focusFiles().length > 0, seed.title() + " has no focus files");
        }
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
