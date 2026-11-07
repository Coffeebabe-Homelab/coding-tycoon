package dev.codingtycoon;

import io.quarkus.test.common.TestResourceScope;
import io.quarkus.test.common.WithTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.oidc.server.OidcWiremockTestResource;
import io.smallrye.jwt.build.Jwt;
import org.junit.jupiter.api.Test;

import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.time.Instant;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

/**
 * Sends real signed tokens through the OIDC validation that prod uses, instead of the
 * injected identity of {@code @TestSecurity}. Issuer and keys come from a local stub server.
 */
// GLOBAL because OIDC is enabled for the whole test run, so every @QuarkusTest needs the stub.
@WithTestResource(value = OidcWiremockTestResource.class, scope = TestResourceScope.GLOBAL)
@QuarkusTest
class OidcTokenValidationTest {

    private static final String ISSUER = "https://server.example.com";
    private static final String AUDIENCE = "https://service.example.com";
    private static final String SIGNING_KEY = "privateKey.jwk";
    private static final String SUB = "auth0|oidc-user";

    @Test
    void validTokenIsAcceptedAndExposesSub() {
        String token = sign(claims(ISSUER, AUDIENCE, Instant.now().plusSeconds(300)));

        given().auth().oauth2(token)
                .when().get("/api/me")
                .then()
                .statusCode(200)
                .body("sub", is(SUB));
    }

    @Test
    void wrongIssuerIsRejected() {
        assertRejected(sign(claims("https://evil.example.com", AUDIENCE, Instant.now().plusSeconds(300))));
    }

    @Test
    void wrongAudienceIsRejected() {
        assertRejected(sign(claims(ISSUER, "https://other.example.com", Instant.now().plusSeconds(300))));
    }

    @Test
    void expiredTokenIsRejected() {
        assertRejected(sign(claims(ISSUER, AUDIENCE, Instant.now().minusSeconds(3600))));
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() throws NoSuchAlgorithmException {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        PrivateKey otherKey = generator.generateKeyPair().getPrivate();

        assertRejected(claims(ISSUER, AUDIENCE, Instant.now().plusSeconds(300))
                .jws().keyId("1").sign(otherKey));
    }

    @Test
    void malformedTokenIsRejected() {
        assertRejected("not-a-jwt");
    }

    private io.smallrye.jwt.build.JwtClaimsBuilder claims(String issuer, String audience, Instant expiresAt) {
        return Jwt.issuer(issuer).audience(audience).subject(SUB).expiresAt(expiresAt);
    }

    private String sign(io.smallrye.jwt.build.JwtClaimsBuilder claims) {
        return claims.jws().keyId("1").sign(SIGNING_KEY);
    }

    private void assertRejected(String token) {
        given().auth().oauth2(token)
                .when().get("/api/me")
                .then()
                .statusCode(401);
    }
}
