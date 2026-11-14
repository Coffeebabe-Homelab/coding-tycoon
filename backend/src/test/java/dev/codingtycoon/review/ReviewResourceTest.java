package dev.codingtycoon.review;

import dev.codingtycoon.progress.ProgressTestData;
import dev.codingtycoon.submission.Submission;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskStatus;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.empty;

@QuarkusTest
class ReviewResourceTest {

    private static final String SUB = "auth0|review-api";
    private static final String OTHER_SUB = "auth0|review-api-other";
    private static final String A = "src/main/java/com/shopfront/A.java";
    private static final String B = "src/main/java/com/shopfront/B.java";

    @Inject
    ProgressTestData progressTestData;

    @Inject
    ReviewTestData testData;

    @Inject
    JpaReviewRepository reviewRepository;

    private Long profileId;

    @BeforeEach
    void setUp() {
        testData.clear();
        profileId = progressTestData.createProfile(SUB);
    }

    private Review pushWithReview(TaskStatus taskStatus, int attempt) {
        Task task = progressTestData.createTask(profileId, "List users", taskStatus);
        Submission push = testData.createPush(task, attempt, A, "class A {}");
        return testData.createReview(push.id);
    }

    @Test
    void withoutATokenIs401() {
        given().when().get("/api/reviews/latest").then().statusCode(401);
    }

    @Test
    @TestSecurity(user = SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = SUB)})
    void anActiveTaskWithoutAPushHasNoReview() {
        progressTestData.createTask(profileId, "Fresh", TaskStatus.IN_PROGRESS);

        given().when().get("/api/reviews/latest").then().statusCode(204);
    }

    @Test
    @TestSecurity(user = SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = SUB)})
    void aQueuedReviewIsPendingWithTheTarget() {
        Review review = pushWithReview(TaskStatus.SUBMITTED, 2);

        given().when().get("/api/reviews/latest")
                .then()
                .statusCode(200)
                .body("id", is(review.id.intValue()))
                .body("submissionId", is(review.submissionId.intValue()))
                .body("attemptNumber", is(2))
                .body("status", is("PENDING"))
                .body("verdict", nullValue())
                .body("comments", empty())
                .body("criteria", empty())
                .body("createdAt", notNullValue())
                .body("targetSeconds", is(30));
    }

    @Test
    @TestSecurity(user = SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = SUB)})
    void commentsComeMustFixFirstThenByFileAndLine() {
        Review review = pushWithReview(TaskStatus.CHANGES_REQUESTED, 1);
        QuarkusTransaction.requiringNew().run(() -> {
            Review stored = reviewRepository.findById(review.id);
            stored.status = ReviewStatus.DONE;
            stored.verdict = ReviewVerdict.CHANGES_REQUESTED;
            stored.summary = "One fix to go.";
            stored.comments.addAll(List.of(
                    ReviewComment.of(A, 1, Severity.PRAISE, "Nice."),
                    ReviewComment.of(B, 2, Severity.MUST_FIX, "Second."),
                    ReviewComment.of(A, 9, Severity.MUST_FIX, "First."),
                    ReviewComment.of(A, 3, Severity.SUGGESTION, "Maybe.")));
            stored.criteria.addAll(List.of(ReviewCriterion.of(0, true), ReviewCriterion.of(1, false)));
        });

        given().when().get("/api/reviews/latest")
                .then()
                .statusCode(200)
                .body("status", is("DONE"))
                .body("verdict", is("CHANGES_REQUESTED"))
                .body("summary", is("One fix to go."))
                .body("comments.body", contains("First.", "Second.", "Maybe.", "Nice."))
                .body("comments[0].path", is(A))
                .body("comments[0].line", is(9))
                .body("comments[0].severity", is("MUST_FIX"))
                .body("criteria.met", contains(true, false));
    }

    @Test
    @TestSecurity(user = SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = SUB)})
    void afterApprovalTheLastReviewStaysVisible() {
        Review review = pushWithReview(TaskStatus.APPROVED, 1);

        given().when().get("/api/reviews/latest")
                .then().statusCode(200).body("id", is(review.id.intValue()));
    }

    @Test
    @TestSecurity(user = SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = SUB)})
    void aFailedReviewHasItsStatusAndNoVerdict() {
        Review review = pushWithReview(TaskStatus.SUBMITTED, 1);
        QuarkusTransaction.requiringNew().run(() -> reviewRepository.findById(review.id).status = ReviewStatus.FAILED);

        given().when().get("/api/reviews/latest")
                .then().statusCode(200).body("status", is("FAILED")).body("verdict", nullValue());
    }

    @Test
    @TestSecurity(user = OTHER_SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = OTHER_SUB)})
    void anotherPlayersReviewIsNeverReturned() {
        pushWithReview(TaskStatus.SUBMITTED, 1);
        progressTestData.createProfile(OTHER_SUB);

        given().when().get("/api/reviews/latest").then().statusCode(204);
    }
}
