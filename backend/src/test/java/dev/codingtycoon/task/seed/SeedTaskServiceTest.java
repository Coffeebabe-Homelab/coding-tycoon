package dev.codingtycoon.task.seed;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.Stream;

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
}
