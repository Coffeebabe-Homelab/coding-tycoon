package dev.codingtycoon.codebase;

import dev.codingtycoon.profile.JpaProfileRepository;
import dev.codingtycoon.profile.PlayerProfile;
import dev.codingtycoon.task.JpaTaskRepository;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.topic.JpaTopicRepository;
import dev.codingtycoon.user.JpaUserRepository;
import dev.codingtycoon.user.User;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.hasItem;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.not;
import static org.hamcrest.CoreMatchers.startsWith;

/**
 * Integration and security tests for /api/codebase endpoints.
 */
@QuarkusTest
class CodebaseResourceTest {

    private static final String TEST_SUB = "auth0|codebase-test-user";
    private static final String NO_TASK_SUB = "auth0|codebase-no-task-user";
    private static final String FOCUS_FILE = "src/main/java/com/shopfront/user/UserController.java";

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
        em.createNativeQuery("DELETE FROM tasks").executeUpdate();
        em.createNativeQuery("DELETE FROM player_profile_topics").executeUpdate();
        profileRepository.deleteAll();
        userRepository.deleteAll();
        topicRepository.deleteAll();

        PlayerProfile profile = createProfile(TEST_SUB);
        createProfile(NO_TASK_SUB);

        Task task = new Task();
        task.playerProfileId = profile.id;
        task.title = "List users";
        task.description = "Add a list endpoint to UserController";
        task.acceptanceCriteria = "- works";
        task.difficulty = "Junior";
        task.focusFiles = FOCUS_FILE;
        taskRepository.persist(task);
    }

    private PlayerProfile createProfile(String sub) {
        User user = new User();
        user.sub = sub;
        user.email = sub + "@example.com";
        userRepository.persist(user);

        PlayerProfile profile = new PlayerProfile();
        profile.userId = user.id;
        profileRepository.persist(profile);
        return profile;
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {@Claim(key = "sub", value = TEST_SUB)})
    void listFilesReturnsActiveTaskCodebase() {
        given()
                .when().get("/api/codebase/files")
                .then()
                .statusCode(200)
                .body("codebase", is("shopfront"))
                .body("focusFiles[0]", is(FOCUS_FILE))
                .body("files", hasItem("README.md"))
                .body("files", hasItem(FOCUS_FILE));
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {@Claim(key = "sub", value = TEST_SUB)})
    void readFileReturnsContent() {
        given()
                .when().get("/api/codebase/files/" + FOCUS_FILE)
                .then()
                .statusCode(200)
                .body("path", is(FOCUS_FILE))
                .body("content", startsWith("package com.shopfront.user;"));
    }

    @Test
    void listFilesUnauthenticatedReturns401() {
        given().when().get("/api/codebase/files").then().statusCode(401);
    }

    @Test
    void readFileUnauthenticatedReturns401() {
        given().when().get("/api/codebase/files/README.md").then().statusCode(401);
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {@Claim(key = "sub", value = TEST_SUB)})
    void unknownPathReturns404() {
        given()
                .when().get("/api/codebase/files/src/main/java/com/shopfront/Nope.java")
                .then()
                .statusCode(404)
                .body("error", is("NotFoundException"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "../../application.properties",
            "..%2F..%2Fapplication.properties",
            "%2e%2e/%2e%2e/application.properties",
            "%2e%2e%2f%2e%2e%2fapplication.properties",
            "src/main/..%2F..%2FREADME.md",
            "%2Fetc%2Fpasswd",
            "codebases/shopfront/index.txt",
            "index.txt"
    })
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {@Claim(key = "sub", value = TEST_SUB)})
    void traversalAttemptsReturn404(String path) {
        given()
                .urlEncodingEnabled(false)
                .when().get("/api/codebase/files/" + path)
                .then()
                .statusCode(404)
                .body(not(is("")));
    }

    @Test
    @TestSecurity(user = NO_TASK_SUB, roles = {})
    @JwtSecurity(claims = {@Claim(key = "sub", value = NO_TASK_SUB)})
    void noActiveTaskReturns404() {
        given()
                .when().get("/api/codebase/files")
                .then()
                .statusCode(404)
                .body("message", startsWith("No active task"));
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {@Claim(key = "sub", value = TEST_SUB)})
    void writeMethodsAreNotAllowed() {
        given().body("x").when().put("/api/codebase/files/README.md").then().statusCode(405);
        given().body("x").when().post("/api/codebase/files/README.md").then().statusCode(405);
        given().when().delete("/api/codebase/files/README.md").then().statusCode(405);
    }
}
