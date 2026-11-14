package dev.codingtycoon.submission;

import dev.codingtycoon.progress.ProgressTestData;
import dev.codingtycoon.task.JpaTaskRepository;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskStatus;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import io.restassured.http.ContentType;
import io.restassured.response.ValidatableResponse;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.containsString;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Integration and security tests for /api/submissions, against PostgreSQL and the real shopfront files.
 */
@QuarkusTest
class SubmissionResourceTest {

    private static final String TEST_SUB = "auth0|submission-test-user";
    private static final String FOCUS_FILE = "src/main/java/com/shopfront/user/UserController.java";

    @Inject
    ProgressTestData testData;

    @Inject
    JpaTaskRepository taskRepository;

    @Inject
    JpaSubmissionRepository submissionRepository;

    private Long taskId;

    @BeforeEach
    void setUp() {
        testData.clear();
        taskId = createTask(testData.createProfile(TEST_SUB));
    }

    private Long createTask(Long profileId) {
        Long id = testData.createTask(profileId, "List users", TaskStatus.IN_PROGRESS).id;
        QuarkusTransaction.requiringNew().run(() -> taskRepository.findById(id).focusFiles = FOCUS_FILE);
        return id;
    }

    @Test
    void pushWithoutTokenReturns401() {
        post(body("feat: x", FOCUS_FILE, "changed")).statusCode(401);
    }

    @Test
    void latestWithoutTokenReturns401() {
        given().when().get("/api/submissions/latest").then().statusCode(401);
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = TEST_SUB)})
    void pushStoresTheSubmissionAndSubmitsTheTask() {
        post(body("feat(users): list users", FOCUS_FILE, "class UserController { /* list */ }"))
                .statusCode(201)
                .body("id", notNullValue())
                .body("taskId", is(taskId.intValue()))
                .body("attemptNumber", is(1))
                .body("commitMessage", is("feat(users): list users"))
                .body("submittedAt", notNullValue())
                .body("files[0].path", is(FOCUS_FILE))
                .body("files[0].content", is("class UserController { /* list */ }"));

        assertEquals(TaskStatus.SUBMITTED, taskRepository.findById(taskId).status);
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = TEST_SUB)})
    void latestIsEmptyBeforeAPushAndReturnsItAfterwards() {
        given().when().get("/api/submissions/latest").then().statusCode(204);

        post(body("feat: list users", FOCUS_FILE, "changed")).statusCode(201);

        given().when().get("/api/submissions/latest")
                .then()
                .statusCode(200)
                .body("attemptNumber", is(1))
                .body("files[0].content", is("changed"));
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = TEST_SUB)})
    void pushingAnotherFileReturns422AndStoresNothing() {
        post(body("feat: x", "../../application.properties", "changed"))
                .statusCode(422)
                .body("message", containsString("not a file of this task"));

        assertEquals(0, submissionRepository.count());
        assertEquals(TaskStatus.IN_PROGRESS, taskRepository.findById(taskId).status);
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = TEST_SUB)})
    void pushingTwiceReturns422BecauseTheTaskIsAlreadySubmitted() {
        post(body("feat: first", FOCUS_FILE, "changed")).statusCode(201);

        post(body("feat: second", FOCUS_FILE, "changed again"))
                .statusCode(422)
                .body("message", containsString("SUBMITTED"));
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = TEST_SUB)})
    void malformedBodyReturns400() {
        given().contentType(ContentType.JSON).body("{not json")
                .when().post("/api/submissions")
                .then()
                .statusCode(400);
    }

    private static Map<String, Object> body(String message, String path, String content) {
        return Map.of("commitMessage", message, "files", new Object[]{Map.of("path", path, "content", content)});
    }

    private static ValidatableResponse post(Map<String, Object> body) {
        return given().contentType(ContentType.JSON).body(body)
                .when().post("/api/submissions")
                .then();
    }
}
