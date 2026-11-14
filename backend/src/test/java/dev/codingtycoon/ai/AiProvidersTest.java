package dev.codingtycoon.ai;

import dev.codingtycoon.review.ReviewAiPort;
import dev.codingtycoon.review.ReviewVerdict;
import dev.codingtycoon.task.TaskAiPort;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** With the default provider (stub), every AI port is backed by its stub adapter. */
@QuarkusTest
class AiProvidersTest {

    @Inject
    TaskAiPort taskAiPort;

    @Inject
    ReviewAiPort reviewAiPort;

    @Test
    void theStubTaskAdapterGeneratesNothing() {
        assertTrue(taskAiPort.generate("Java", "Junior", List.of("rest-apis")).isEmpty());
    }

    @Test
    void theStubReviewerApprovesTheSecondAttempt() {
        assertEquals(ReviewVerdict.APPROVED,
                reviewAiPort.review(ReviewAiPortContract.request(2)).orElseThrow().verdict());
    }
}
