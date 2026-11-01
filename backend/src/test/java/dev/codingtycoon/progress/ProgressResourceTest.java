package dev.codingtycoon.progress;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

/** Integration tests for GET /api/progress. */
@QuarkusTest
class ProgressResourceTest {

    private static final String TEST_SUB = "auth0|progress-resource-user";
    private static final String NO_PROFILE_SUB = "auth0|progress-no-profile-user";

    @Inject
    ProgressTestData testData;

    private Long profileId;

    @BeforeEach
    void setUp() {
        testData.clear();
        profileId = testData.createProfile(TEST_SUB);
        testData.createUser(NO_PROFILE_SUB);
    }

    @Test
    @TestSecurity(user = TEST_SUB, roles = {})
    @JwtSecurity(claims = {@Claim(key = "sub", value = TEST_SUB)})
    void getProgressReturns200WithTotalsAndStreak() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        testData.createEvent(profileId, testData.createTask(profileId), now);
        testData.createEvent(profileId, testData.createTask(profileId), now.minusDays(1));

        given()
                .when().get("/api/progress")
                .then()
                .statusCode(200)
                .body("totalXp", is(200))
                .body("xpToday", is(100))
                .body("currentStreak", is(2))
                .body("longestStreak", is(2));
    }

    @Test
    void getProgressUnauthenticatedReturns401() {
        given()
                .when().get("/api/progress")
                .then()
                .statusCode(401);
    }

    @Test
    @TestSecurity(user = NO_PROFILE_SUB, roles = {})
    @JwtSecurity(claims = {@Claim(key = "sub", value = NO_PROFILE_SUB)})
    void getProgressWithoutProfileReturns404() {
        given()
                .when().get("/api/progress")
                .then()
                .statusCode(404);
    }
}
