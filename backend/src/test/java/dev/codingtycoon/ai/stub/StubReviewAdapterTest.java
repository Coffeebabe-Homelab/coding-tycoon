package dev.codingtycoon.ai.stub;

import dev.codingtycoon.ai.ReviewAiPortContract;
import dev.codingtycoon.review.ReviewAiPort;
import dev.codingtycoon.review.ReviewFile;
import dev.codingtycoon.review.ReviewRequest;
import dev.codingtycoon.review.ReviewResult;
import dev.codingtycoon.review.ReviewVerdict;
import dev.codingtycoon.review.Severity;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StubReviewAdapterTest extends ReviewAiPortContract {

    private final StubReviewAdapter stub = new StubReviewAdapter();

    @Override
    protected ReviewAiPort healthyAdapter() {
        return stub;
    }

    /** The stub has no provider that can fail, so an empty port stands in to keep the contract complete. */
    @Override
    protected ReviewAiPort failingAdapter() {
        return request -> java.util.Optional.empty();
    }

    @Test
    void theFirstAttemptGetsChangesRequestedWithEverySeverity() {
        ReviewResult review = stub.review(request(1)).orElseThrow();

        assertEquals(ReviewVerdict.CHANGES_REQUESTED, review.verdict());
        assertEquals(List.of(Severity.MUST_FIX, Severity.SUGGESTION, Severity.PRAISE),
                review.comments().stream().map(ReviewResult.Comment::severity).toList());
        assertEquals(List.of(true, true, false), review.criteriaMet());
        assertEquals(3, review.comments().get(0).line());
    }

    @Test
    void aLaterAttemptIsApproved() {
        ReviewResult review = stub.review(request(2)).orElseThrow();

        assertEquals(ReviewVerdict.APPROVED, review.verdict());
        assertEquals(List.of(true, true, true), review.criteriaMet());
    }

    @Test
    void aTaskWithoutCriteriaStillGetsAReview() {
        ReviewRequest noCriteria = new ReviewRequest(1, "t", "d", List.of(),
                List.of(new ReviewFile("A.java", "")), List.of(new ReviewFile("A.java", "")), "");

        ReviewResult review = stub.review(noCriteria).orElseThrow();

        assertEquals(List.of(), review.criteriaMet());
        assertEquals(1, review.comments().get(0).line());
    }
}
