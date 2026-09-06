package dev.codingtycoon.user;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

/**
 * Integration tests for the /api/me endpoint (UserResource).
 * Verifies that authenticated users receive their sub claim and unauthenticated requests get 401.
 */
@QuarkusTest
class UserResourceTest {

    @Test
    @TestSecurity(user = "auth0|test-user-456", roles = {})
    @JwtSecurity(claims = {
            @Claim(key = "sub", value = "auth0|test-user-456")
    })
    void authenticatedUserReceivesSubClaim() {
        given()
                .when().get("/api/me")
                .then()
                .statusCode(200)
                .body("sub", is("auth0|test-user-456"));
    }

    @Test
    void unauthenticatedRequestReceives401() {
        given()
                .when().get("/api/me")
                .then()
                .statusCode(401);
    }
}
