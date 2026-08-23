package dev.codingtycoon;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.jwt.Claim;
import io.quarkus.test.security.jwt.JwtSecurity;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
class MeResourceTest {

    @Test
    @TestSecurity(user = "auth0|test-user-123", roles = {})
    @JwtSecurity(claims = {
        @Claim(key = "sub", value = "auth0|test-user-123")
    })
    void authenticatedUserReceivesSubClaim() {
        given()
            .when().get("/api/me")
            .then()
            .statusCode(200)
            .body("sub", is("auth0|test-user-123"));
    }

    @Test
    void unauthenticatedRequestReceives401() {
        given()
            .when().get("/api/me")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "auth0|another-user", roles = {})
    @JwtSecurity(claims = {
        @Claim(key = "sub", value = "auth0|another-user")
    })
    void subClaimIsNotNull() {
        given()
            .when().get("/api/me")
            .then()
            .statusCode(200)
            .body("sub", notNullValue());
    }
}
