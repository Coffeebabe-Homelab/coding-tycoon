package dev.codingtycoon.topic;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Runs against the topics seeded by Flyway V5. */
@QuarkusTest
class JpaTopicRepositoryTest {

    private static final Long UNKNOWN_ID = -1L;

    @Inject
    JpaTopicRepository repository;

    @Test
    void nullIdsReturnNothing() {
        assertTrue(repository.listByIds(null).isEmpty());
    }

    @Test
    void emptyIdsReturnNothing() {
        assertTrue(repository.listByIds(List.of()).isEmpty());
    }

    @Test
    void unknownIdsAreIgnored() {
        Long seedId = repository.find("slug", "oop").firstResult().id;

        List<Topic> topics = repository.listByIds(List.of(seedId, UNKNOWN_ID));

        assertEquals(1, topics.size());
        assertEquals("oop", topics.getFirst().slug);
    }
}
