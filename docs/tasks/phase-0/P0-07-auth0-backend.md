# P0-07 — Auth0 JWT Validation (Backend)

**Phase:** 0 — Foundation  
**Status:** 🔲 Not started  
**Depends on:** P0-02, P0-05  

---

## Goal

Configure Quarkus OIDC to validate Auth0-issued JWTs. A protected test endpoint returns the authenticated user's `sub` claim. Unauthenticated requests receive 401.

---

## Acceptance Criteria

- [ ] `quarkus-oidc` extension added to `pom.xml`
- [ ] Auth0 OIDC issuer and audience configured in `application.properties`
- [ ] `GET /api/me` returns `{ "sub": "<auth0-user-id>" }` when called with a valid Bearer token
- [ ] `GET /api/me` returns `401 Unauthorized` when called without a token or with an invalid token
- [ ] `@RolesAllowed` or `@Authenticated` annotation used on the protected resource
- [ ] Integration test covers both authenticated and unauthenticated scenarios

---

## Implementation Notes

```xml
<!-- pom.xml -->
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-oidc</artifactId>
</dependency>
```

```properties
# application.properties
quarkus.oidc.auth-server-url=https://${AUTH0_DOMAIN}/
quarkus.oidc.client-id=${AUTH0_AUDIENCE}
quarkus.oidc.token.audience=${AUTH0_AUDIENCE}
quarkus.oidc.application-type=service
```

```java
// MeResource.java
@Path("/api/me")
@Authenticated
public class MeResource {
    @Inject JsonWebToken jwt;

    @GET
    public Response me() {
        return Response.ok(Map.of("sub", jwt.getSubject())).build();
    }
}
```

**Environment variables** (add to backend's `.env` or pass via system properties):
```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.codingtycoon.dev
```

**Integration test:**
```java
// Use Quarkus @TestSecurity annotation to mock a JWT in tests:
@TestSecurity(user = "test-user", roles = "user")
@Test
public void testMeAuthenticated() {
    given().when().get("/api/me").then().statusCode(200).body("sub", notNullValue());
}
```

---

## Notes

- Quarkus OIDC fetches the Auth0 JWKS automatically from the well-known endpoint — no manual key configuration needed.
- The `sub` claim will be used as the foreign key for all player data in the database.
- CORS configuration will be needed once frontend and backend run on different ports (add in this task or Phase 1).

---

## Definition of Done

- Protected endpoint returns 200 + sub with valid token; returns 401 without token. Integration test passes.
