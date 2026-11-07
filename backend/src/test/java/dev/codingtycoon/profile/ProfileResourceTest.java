package dev.codingtycoon.profile;

import dev.codingtycoon.progress.ProgressTestData;
import dev.codingtycoon.topic.JpaTopicRepository;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.hasSize;

/**
 * Integration tests for the /api/profile endpoints.
 * Runs on PostgreSQL with the Flyway schema; topics come from the V5 seed.
 */
@QuarkusTest
class ProfileResourceTest {

    private static final String TEST_SUB = "auth0|profile-test-user";

    @Inject
    JpaTopicRepository topicRepository;

    @Inject
    ProgressTestData testData;

    /** Seed topic IDs, looked up in setUp so tests don't depend on generated values. */
    private Long topicId1;
    private Long topicId2;

    @BeforeEach
    @Transactional
    void setUp() {
        testData.clear();
        topicId1 = topicRepository.find("slug", "rest-apis").firstResult().id;
        topicId2 = topicRepository.find("slug", "crud").firstResult().id;
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB),
            @Claim(key = "email", value = "test@example.com")
    })
    void createProfileReturns201WithBody() {
        given()
                .contentType(ContentType.JSON)
                .body(buildRequest("Java", "Spring Boot", "Junior", List.of(topicId1, topicId2)))
                .when().post("/api/profile")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("language", is("Java"))
                .body("framework", is("Spring Boot"))
                .body("seniority", is("Junior"))
                .body("topics", hasSize(2));
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB),
            @Claim(key = "email", value = "test@example.com")
    })
    void getProfileReturns200AfterCreate() {
        // First create
        given()
                .contentType(ContentType.JSON)
                .body(buildRequest("Java", "Quarkus", "Mid", List.of(topicId1)))
                .when().post("/api/profile")
                .then()
                .statusCode(201);

        // Then get
        given()
                .when().get("/api/profile")
                .then()
                .statusCode(200)
                .body("language", is("Java"))
                .body("framework", is("Quarkus"))
                .body("seniority", is("Mid"))
                .body("topics", hasSize(1));
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB),
            @Claim(key = "email", value = "test@example.com")
    })
    void updateProfileReturns200WithUpdatedData() {
        // Create first
        given()
                .contentType(ContentType.JSON)
                .body(buildRequest("Java", "Spring Boot", "Junior", List.of(topicId1)))
                .when().post("/api/profile")
                .then()
                .statusCode(201);

        // Update
        given()
                .contentType(ContentType.JSON)
                .body(buildRequest("Kotlin", "Ktor", "Senior", List.of(topicId2)))
                .when().put("/api/profile")
                .then()
                .statusCode(200)
                .body("language", is("Kotlin"))
                .body("framework", is("Ktor"))
                .body("seniority", is("Senior"))
                .body("topics", hasSize(1))
                .body("topics[0].slug", is("crud"));
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB),
            @Claim(key = "email", value = "test@example.com")
    })
    void duplicateCreateReturns409() {
        String body = buildRequest("Java", "Spring Boot", "Junior", List.of(topicId1));

        // First create
        given()
                .contentType(ContentType.JSON)
                .body(body)
                .when().post("/api/profile")
                .then()
                .statusCode(201);

        // Duplicate — should conflict
        given()
                .contentType(ContentType.JSON)
                .body(body)
                .when().post("/api/profile")
                .then()
                .statusCode(409);
    }

    @Test
    void unauthenticatedRequestReturns401() {
        given()
                .contentType(ContentType.JSON)
                .body(buildRequest("Java", "Spring Boot", "Junior", List.of(1L)))
                .when().post("/api/profile")
                .then()
                .statusCode(401);
    }

    @Test
    void unauthenticatedGetReturns401() {
        given()
                .when().get("/api/profile")
                .then()
                .statusCode(401);
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB),
            @Claim(key = "email", value = "test@example.com")
    })
    void missingFieldsReturns422() {
        // Empty body — all fields are @NotBlank/@NotNull
        given()
                .contentType(ContentType.JSON)
                .body("{}")
                .when().post("/api/profile")
                .then()
                .statusCode(422);
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB),
            @Claim(key = "email", value = "test@example.com")
    })
    void emptyTopicListReturns422() {
        // topicIds must have min=1
        given()
                .contentType(ContentType.JSON)
                .body(buildRequest("Java", "Spring Boot", "Junior", List.of()))
                .when().post("/api/profile")
                .then()
                .statusCode(422);
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @OidcSecurity(claims = {
            @Claim(key = "sub", value = TEST_SUB),
            @Claim(key = "email", value = "test@example.com")
    })
    void getProfileReturns404WhenNoProfileExists() {
        given()
                .when().get("/api/profile")
                .then()
                .statusCode(404);
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private String buildRequest(String language, String framework, String seniority, List<Long> topicIds) {
        String ids = topicIds.stream()
                .map(String::valueOf)
                .reduce((a, b) -> a + "," + b)
                .orElse("");
        return String.format(
                "{\"language\":\"%s\",\"framework\":\"%s\",\"seniority\":\"%s\",\"topicIds\":[%s]}",
                language, framework, seniority, ids
        );
    }
}
