package dev.codingtycoon.task;

import dev.codingtycoon.progress.ProgressTestData;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;

/**
 * A model call on CPU can take minutes, so it must not hold a DB connection or run into the
 * transaction timeout. The AI port is called with no transaction active.
 */
@QuarkusTest
class TaskGenerationTransactionTest {

    private static final String SUB = "auth0|generation-tx";

    @InjectMock
    TaskAiPort taskAiPort;

    @Inject
    ProgressTestData testData;

    @BeforeEach
    void setUp() {
        testData.clear();
        testData.createProfile(SUB);
    }

    @Test
    @TestSecurity(user = SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = SUB)})
    void theAiIsCalledOutsideATransaction() {
        AtomicBoolean called = new AtomicBoolean();
        AtomicBoolean inTransaction = new AtomicBoolean();
        Mockito.when(taskAiPort.generate(any(), any(), any())).thenAnswer(invocation -> {
            called.set(true);
            inTransaction.set(QuarkusTransaction.isActive());
            return Optional.empty();
        });

        given().contentType("application/json").when().post("/api/tasks/generate").then().statusCode(201);

        assertTrue(called.get());
        assertFalse(inTransaction.get());
    }
}
