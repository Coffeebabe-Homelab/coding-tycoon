package dev.codingtycoon.ai;

import dev.codingtycoon.review.ReviewAiPort;
import dev.codingtycoon.review.ReviewFile;
import dev.codingtycoon.review.ReviewRequest;
import dev.codingtycoon.review.ReviewResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * What every {@link ReviewAiPort} adapter must do, whatever the provider: a review that fits the push
 * (comments on pushed files and lines, one result per criterion), or empty, and never an exception.
 */
public abstract class ReviewAiPortContract {

    protected static final List<ReviewFile> PUSHED = List.of(
            new ReviewFile("src/main/java/com/shopfront/user/UserController.java", "class A {\n  int b;\n}\n"),
            new ReviewFile("src/main/java/com/shopfront/user/UserService.java", "class S {}\n"));

    protected static ReviewRequest request(int attempt) {
        return new ReviewRequest(attempt, "List the users", "Add GET /api/users",
                List.of("Returns 200", "Returns JSON", "Has a test"), PUSHED, PUSHED, "Be specific.");
    }

    /** An adapter whose provider answers normally. */
    protected abstract ReviewAiPort healthyAdapter();

    /** An adapter whose provider is down, slow or answers with something unusable. */
    protected abstract ReviewAiPort failingAdapter();

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 5})
    void aReviewFitsThePush(int attempt) {
        healthyAdapter().review(request(attempt)).ifPresent(review -> {
            assertNotNull(review.verdict());
            assertFalse(review.summary().isBlank());
            assertEquals(3, review.criteriaMet().size());
            Map<String, Integer> lines = PUSHED.stream()
                    .collect(Collectors.toMap(ReviewFile::path, ReviewFile::lineCount));
            for (ReviewResult.Comment comment : review.comments()) {
                assertTrue(lines.containsKey(comment.path()), comment.path());
                assertTrue(comment.line() >= 1 && comment.line() <= lines.get(comment.path()));
                assertNotNull(comment.severity());
                assertFalse(comment.body().isBlank());
            }
        });
    }

    @Test
    void aFailingProviderGivesEmptyInsteadOfThrowing() {
        assertTrue(failingAdapter().review(request(1)).isEmpty());
    }
}
