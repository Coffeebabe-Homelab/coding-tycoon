package dev.codingtycoon;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Boots with the same schema check as prod, so a mismatch between the JPA entities and the
 * Flyway migrations fails here instead of at startup in staging or prod.
 */
@QuarkusTest
@TestProfile(SchemaValidationTest.ValidateSchemaProfile.class)
class SchemaValidationTest {

    /** Reaching any test method means Hibernate accepted the migrated schema. */
    public static class ValidateSchemaProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of("quarkus.hibernate-orm.database.generation", "validate");
        }
    }

    @Inject
    Flyway flyway;

    @Test
    void entitiesMatchTheMigratedSchema() {
        assertTrue(flyway.info().applied().length > 0, "expected Flyway to have applied migrations");
        assertEquals(0, flyway.info().pending().length, "expected no pending migrations");
    }
}
