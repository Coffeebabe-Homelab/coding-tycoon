package dev.codingtycoon.ai.stub;

import dev.codingtycoon.review.ReviewAiPort;
import dev.codingtycoon.review.ReviewFile;
import dev.codingtycoon.review.ReviewRequest;
import dev.codingtycoon.review.ReviewResult;
import dev.codingtycoon.review.ReviewResult.Comment;
import dev.codingtycoon.review.ReviewVerdict;
import dev.codingtycoon.review.Severity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Typed;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * A predictable reviewer with no AI: attempt 1 gets changes requested, later attempts are approved.
 * Both review paths can be played on staging, and tested in CI, without a model.
 */
@ApplicationScoped
@Typed(StubReviewAdapter.class) // AiProviders exposes the selected adapter as the only ReviewAiPort.
public class StubReviewAdapter implements ReviewAiPort {

    @Override
    public Optional<ReviewResult> review(ReviewRequest request) {
        ReviewFile file = request.pushed().get(0);
        int lastLine = file.lineCount();
        int criteria = request.criteria().size();
        if (request.attemptNumber() == 1) {
            List<Boolean> met = new ArrayList<>(Collections.nCopies(criteria, true));
            if (criteria > 0) {
                met.set(criteria - 1, false);
            }
            return Optional.of(new ReviewResult(ReviewVerdict.CHANGES_REQUESTED,
                    "Close: one thing to fix before this ships.",
                    List.of(new Comment(file.path(), lastLine, Severity.MUST_FIX,
                                    "Stub review: the last acceptance criterion isn't covered yet."),
                            new Comment(file.path(), 1, Severity.SUGGESTION,
                                    "Stub review: a short comment on why would help the next reader."),
                            new Comment(file.path(), 1, Severity.PRAISE,
                                    "Stub review: the change stays small and on topic.")),
                    met));
        }
        return Optional.of(new ReviewResult(ReviewVerdict.APPROVED, "Ship it: every criterion is met.",
                List.of(new Comment(file.path(), 1, Severity.PRAISE, "Stub review: clean fix.")),
                Collections.nCopies(criteria, true)));
    }
}
