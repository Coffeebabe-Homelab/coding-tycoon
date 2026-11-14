package dev.codingtycoon.review;

import dev.codingtycoon.review.ReviewResult.Comment;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReviewResultValidatorTest {

    private static final String A = "src/A.java";
    private static final ReviewRequest REQUEST = new ReviewRequest(1, "Title", "Description",
            List.of("One", "Two"), List.of(), List.of(new ReviewFile(A, "a\nb\nc\n")), "");

    private static ReviewResult result(ReviewVerdict verdict, String summary, List<Comment> comments,
                                       List<Boolean> criteria) {
        return new ReviewResult(verdict, summary, comments, criteria);
    }

    private static Optional<String> check(ReviewResult result) {
        return ReviewResultValidator.problem(REQUEST, result);
    }

    @Test
    void aResultThatFitsThePushIsValid() {
        assertTrue(check(result(ReviewVerdict.APPROVED, "Good.",
                List.of(new Comment(A, 1, Severity.PRAISE, "Nice."), new Comment(A, 3, Severity.MUST_FIX, "Fix.")),
                List.of(true, false))).isEmpty());
    }

    @Test
    void aMissingVerdictIsInvalid() {
        assertEquals(Optional.of("no verdict"), check(result(null, "Good.", List.of(), List.of(true, true))));
    }

    @Test
    void aBlankSummaryIsInvalid() {
        assertEquals(Optional.of("no summary"),
                check(result(ReviewVerdict.APPROVED, " ", List.of(), List.of(true, true))));
    }

    @Test
    void aCommentOnAFileThatWasNotPushedIsInvalid() {
        assertEquals(Optional.of("comment on a file not pushed: src/B.java"), check(result(ReviewVerdict.APPROVED,
                "Good.", List.of(new Comment("src/B.java", 1, Severity.PRAISE, "x")), List.of(true, true))));
    }

    @Test
    void aCommentOutsideTheFileIsInvalid() {
        assertEquals(Optional.of("comment line 4 outside src/A.java (3 lines)"), check(result(ReviewVerdict.APPROVED,
                "Good.", List.of(new Comment(A, 4, Severity.PRAISE, "x")), List.of(true, true))));
        assertTrue(check(result(ReviewVerdict.APPROVED, "Good.",
                List.of(new Comment(A, 0, Severity.PRAISE, "x")), List.of(true, true))).isPresent());
    }

    @Test
    void aCommentWithoutSeverityOrBodyIsInvalid() {
        assertEquals(Optional.of("comment without severity or body"), check(result(ReviewVerdict.APPROVED,
                "Good.", List.of(new Comment(A, 1, null, "x")), List.of(true, true))));
        assertEquals(Optional.of("comment without severity or body"), check(result(ReviewVerdict.APPROVED,
                "Good.", List.of(new Comment(A, 1, Severity.PRAISE, "")), List.of(true, true))));
    }

    @Test
    void theCriteriaCountMustMatchTheTask() {
        assertEquals(Optional.of("1 criteria results for 2 criteria"),
                check(result(ReviewVerdict.APPROVED, "Good.", List.of(), List.of(true))));
    }

    @Test
    void missingListsAreInvalid() {
        assertTrue(check(result(ReviewVerdict.APPROVED, "Good.", null, List.of(true, true))).isPresent());
        assertTrue(check(result(ReviewVerdict.APPROVED, "Good.", List.of(), null)).isPresent());
    }
}
