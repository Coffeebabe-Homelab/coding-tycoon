package dev.codingtycoon.review;

import dev.codingtycoon.submission.Submission;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The V11 schema and the JPA mapping, on PostgreSQL. */
@QuarkusTest
class JpaReviewRepositoryTest {

    private static final String PATH = "src/main/java/com/shopfront/user/UserController.java";

    @Inject
    JpaReviewRepository repository;

    @Inject
    ReviewTestData testData;

    private Submission push;

    @BeforeEach
    void setUp() {
        testData.clear();
        push = testData.createPush("auth0|review-repo", PATH, "class A {}");
    }

    @Test
    @Transactional
    void aReviewIsStoredWithItsCommentsAndCriteria() {
        Review review = new Review();
        review.submissionId = push.id;
        review.status = ReviewStatus.DONE;
        review.verdict = ReviewVerdict.CHANGES_REQUESTED;
        review.summary = "Close, one fix to go.";
        review.comments.add(ReviewComment.of(PATH, 3, Severity.MUST_FIX, "Validate the input."));
        review.comments.add(ReviewComment.of(PATH, 1, Severity.PRAISE, "Clean controller."));
        review.criteria.add(ReviewCriterion.of(1, false));
        review.criteria.add(ReviewCriterion.of(0, true));
        repository.save(review);
        repository.getEntityManager().clear();

        Review found = repository.findBySubmissionId(push.id).orElseThrow();

        assertEquals(ReviewVerdict.CHANGES_REQUESTED, found.verdict);
        assertEquals(List.of(Severity.MUST_FIX, Severity.PRAISE),
                found.comments.stream().map(c -> c.severity).toList());
        assertEquals(List.of(0, 1), found.criteria.stream().map(c -> c.position).toList());
        assertEquals(found.id, repository.findReviewById(found.id).orElseThrow().id);
    }

    @Test
    void aPushWithoutAReviewHasNone() {
        assertTrue(repository.findBySubmissionId(push.id).isEmpty());
    }

    @Test
    void aPushCanHaveOnlyOneReview() {
        testData.createReview(push.id);

        assertThrows(Exception.class, () -> testData.createReview(push.id));
    }
}
