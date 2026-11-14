package dev.codingtycoon.review.worker;

import dev.codingtycoon.progress.JpaXpEventRepository;
import dev.codingtycoon.progress.ProgressTestData;
import dev.codingtycoon.task.JpaTaskRepository;
import dev.codingtycoon.task.TaskStatus;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The whole loop with the stub reviewer: push, changes requested, push again, approved. */
@QuarkusTest
class ReviewLoopTest {

    private static final String SUB = "auth0|review-loop";
    private static final String FOCUS = "src/main/java/com/shopfront/user/UserController.java";

    @Inject
    ReviewWorker worker;

    @Inject
    ProgressTestData testData;

    @Inject
    JpaTaskRepository taskRepository;

    @Inject
    JpaXpEventRepository xpEventRepository;

    private Long taskId;

    @BeforeEach
    void setUp() {
        testData.clear();
        Long id = testData.createTask(testData.createProfile(SUB), "List users", TaskStatus.IN_PROGRESS).id;
        QuarkusTransaction.requiringNew().run(() -> {
            var task = taskRepository.findById(id);
            task.focusFiles = FOCUS;
            task.acceptanceCriteria = "Returns 200\nHas a test";
        });
        taskId = id;
    }

    private void push(String content) {
        given().contentType(ContentType.JSON)
                .body(Map.of("commitMessage", "feat: list users",
                        "files", new Object[]{Map.of("path", FOCUS, "content", content)}))
                .when().post("/api/submissions").then().statusCode(201);
    }

    private TaskStatus taskStatus() {
        return QuarkusTransaction.requiringNew().call(() -> taskRepository.findById(taskId).status);
    }

    @Test
    @TestSecurity(user = SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = SUB)})
    void aTaskIsReviewedUntilApprovedAndPaidOnce() {
        push("class UserController {\n  // first try\n}\n");
        assertTrue(worker.runOnce());

        given().when().get("/api/reviews/latest").then().statusCode(200)
                .body("attemptNumber", is(1))
                .body("status", is("DONE"))
                .body("verdict", is("CHANGES_REQUESTED"))
                .body("comments[0].severity", is("MUST_FIX"))
                .body("criteria.met", org.hamcrest.Matchers.contains(true, false));
        assertEquals(TaskStatus.CHANGES_REQUESTED, taskStatus());

        push("class UserController {\n  // second try\n}\n");
        assertTrue(worker.runOnce());

        given().when().get("/api/reviews/latest").then().statusCode(200)
                .body("attemptNumber", is(2))
                .body("verdict", is("APPROVED"));
        assertEquals(TaskStatus.APPROVED, taskStatus());
        assertEquals(1, xpEventRepository.count(), "ticket XP only: approved on attempt 2");
        assertFalse(worker.runOnce(), "nothing left to review");
    }
}
