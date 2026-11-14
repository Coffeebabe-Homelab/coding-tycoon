package dev.codingtycoon.review;

import dev.codingtycoon.progress.ProgressTestData;
import dev.codingtycoon.submission.JpaSubmissionRepository;
import dev.codingtycoon.task.JpaTaskRepository;
import dev.codingtycoon.task.TaskStatus;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;

/** A push and its review commit together: a push can't exist without a queued review. */
@QuarkusTest
class ReviewQueueingTest {

    private static final String SUB = "auth0|review-queueing";
    private static final String FOCUS_FILE = "src/main/java/com/shopfront/user/UserController.java";

    @InjectMock
    ReviewQueue reviewQueue;

    @Inject
    ProgressTestData testData;

    @Inject
    JpaTaskRepository taskRepository;

    @Inject
    JpaSubmissionRepository submissionRepository;

    @Inject
    JpaReviewRepository reviewRepository;

    private Long taskId;

    @BeforeEach
    void setUp() {
        testData.clear();
        taskId = testData.createTask(testData.createProfile(SUB), "List users", TaskStatus.IN_PROGRESS).id;
        QuarkusTransaction.requiringNew().run(() -> taskRepository.findById(taskId).focusFiles = FOCUS_FILE);
    }

    @Test
    @TestSecurity(user = SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = SUB)})
    void whenQueueingFailsThePushIsRolledBack() {
        Mockito.doThrow(new IllegalStateException("queue down")).when(reviewQueue).enqueue(any());

        given().contentType("application/json")
                .body(Map.of("commitMessage", "feat: x",
                        "files", java.util.List.of(Map.of("path", FOCUS_FILE, "content", "changed"))))
                .when().post("/api/submissions")
                .then().statusCode(500);

        assertEquals(0, submissionRepository.count());
        assertEquals(0, reviewRepository.count());
        assertEquals(TaskStatus.IN_PROGRESS, taskRepository.findById(taskId).status);
    }
}
