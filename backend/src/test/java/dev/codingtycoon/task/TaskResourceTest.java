package dev.codingtycoon.task;

import dev.codingtycoon.profile.JpaProfileRepository;
import dev.codingtycoon.profile.PlayerProfile;
import dev.codingtycoon.topic.JpaTopicRepository;
import dev.codingtycoon.topic.Topic;
import dev.codingtycoon.user.JpaUserRepository;
import dev.codingtycoon.user.User;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;

/**
 * Integration tests for /api/tasks endpoints.
 * Uses H2 in-memory DB (drop-and-create); topics and profile are inserted manually per test.
 */
@QuarkusTest
class TaskResourceTest {

    private static final String TEST_SUB = "auth0|task-test-user";
    private static final String NO_PROFILE_SUB = "auth0|task-no-profile-user";

    @Inject
    JpaUserRepository userRepository;

    @Inject
    JpaProfileRepository profileRepository;

    @Inject
    JpaTopicRepository topicRepository;

    @Inject
    JpaTaskRepository taskRepository;

    @Inject
    EntityManager em;

    @BeforeEach
    @Transactional
    void setUp() {
        // Clean up — respect FK order: tasks → join table → profiles → users → topics
        em.createNativeQuery("DELETE FROM tasks").executeUpdate();
        em.createNativeQuery("DELETE FROM player_profile_topics").executeUpdate();
        profileRepository.deleteAll();
        userRepository.deleteAll();
        topicRepository.deleteAll();

        // Insert topics
        Topic t1 = new Topic();
        t1.name = "REST APIs";
        t1.slug = "rest-apis";
        topicRepository.persist(t1);

        Topic t2 = new Topic();
        t2.name = "CRUD";
        t2.slug = "crud";
        topicRepository.persist(t2);

        // Insert user + profile for the main test user
        User user = new User();
        user.sub = TEST_SUB;
        user.email = "task-test@example.com";
        userRepository.persist(user);

        PlayerProfile profile = new PlayerProfile();
        profile.userId = user.id;
        profile.language = "Java";
        profile.framework = "Spring Boot";
        profile.seniority = "Junior";
        profile.topics = List.of(t1, t2);
        profileRepository.persist(profile);

        // Insert user with NO profile (for 404 test)
        User noProfileUser = new User();
        noProfileUser.sub = NO_PROFILE_SUB;
        noProfileUser.email = "no-profile@example.com";
        userRepository.persist(noProfileUser);
    }

    // ---------------------------------------------------------------------------
    // GET /api/tasks/today
    // ---------------------------------------------------------------------------

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB)
    })
    void getTodayTaskFirstCallCreatesTask201() {
        given()
                .when().get("/api/tasks/today")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("title", notNullValue())
                .body("status", is("ASSIGNED"));
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB)
    })
    void getTodayTaskSecondCallReturnsSameTask200() {
        // First call — creates task
        Integer taskId = given()
                .when().get("/api/tasks/today")
                .then()
                .statusCode(201)
                .extract().path("id");

        // Second call — returns same task
        given()
                .when().get("/api/tasks/today")
                .then()
                .statusCode(200)
                .body("id", is(taskId));
    }

    @Test
    void getTodayTaskUnauthenticatedReturns401() {
        given()
                .when().get("/api/tasks/today")
                .then()
                .statusCode(401);
    }

    @Test
    @TestSecurity(user = NO_PROFILE_SUB, roles = {})
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = NO_PROFILE_SUB)
    })
    void getTodayTaskWithNoProfileReturns404() {
        given()
                .when().get("/api/tasks/today")
                .then()
                .statusCode(404);
    }

    // ---------------------------------------------------------------------------
    // PATCH /api/tasks/{id}/status
    // ---------------------------------------------------------------------------

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB)
    })
    void patchStatusValidTransitionReturns200() {
        // Create the task first
        Integer taskId = given()
                .when().get("/api/tasks/today")
                .then()
                .statusCode(201)
                .extract().path("id");

        // Transition ASSIGNED → IN_PROGRESS
        given()
                .contentType(ContentType.JSON)
                .body("{\"status\":\"IN_PROGRESS\"}")
                .when().patch("/api/tasks/" + taskId + "/status")
                .then()
                .statusCode(200)
                .body("status", is("IN_PROGRESS"));
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB)
    })
    void patchStatusInvalidTransitionReturns422() {
        // Create task (status = ASSIGNED)
        Integer taskId = given()
                .when().get("/api/tasks/today")
                .then()
                .statusCode(201)
                .extract().path("id");

        // ASSIGNED → APPROVED is invalid
        given()
                .contentType(ContentType.JSON)
                .body("{\"status\":\"APPROVED\"}")
                .when().patch("/api/tasks/" + taskId + "/status")
                .then()
                .statusCode(422);
    }

    @Test
    void patchStatusUnauthenticatedReturns401() {
        given()
                .contentType(ContentType.JSON)
                .body("{\"status\":\"IN_PROGRESS\"}")
                .when().patch("/api/tasks/1/status")
                .then()
                .statusCode(401);
    }

    // ---------------------------------------------------------------------------
    // POST /api/tasks/generate
    // ---------------------------------------------------------------------------

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB)
    })
    void generateTaskCreatesTaskReturns201() {
        given()
                .contentType(ContentType.JSON)
                .when().post("/api/tasks/generate")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("title", notNullValue())
                .body("status", is("ASSIGNED"));
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB)
    })
    void generateTaskWhenActiveTaskExistsReturns409() {
        // Create a task via generate
        given()
                .contentType(ContentType.JSON)
                .when().post("/api/tasks/generate")
                .then()
                .statusCode(201);

        // Second generate — should conflict
        given()
                .contentType(ContentType.JSON)
                .when().post("/api/tasks/generate")
                .then()
                .statusCode(409);
    }
}
