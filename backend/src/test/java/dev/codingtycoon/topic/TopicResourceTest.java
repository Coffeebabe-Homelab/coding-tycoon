package dev.codingtycoon.topic;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;

/**
 * Integration tests for GET /api/topics against the topics seeded by Flyway V5.
 * No authentication required — topics are public data.
 */
@QuarkusTest
class TopicResourceTest {

    @Test
    void listTopicsReturnsAllTopics() {
        given()
                .when().get("/api/topics")
                .then()
                .statusCode(200)
                .body("$", hasSize(5))
                .body("slug", containsInAnyOrder("rest-apis", "crud", "oop", "clean-code", "git-workflow"));
    }

    @Test
    void listTopicsDoesNotRequireAuthentication() {
        given()
                .when().get("/api/topics")
                .then()
                .statusCode(200);
    }

    @Test
    void listTopicsReturnsExpectedFields() {
        given()
                .when().get("/api/topics")
                .then()
                .statusCode(200)
                .body("find { it.slug == 'rest-apis' }.name", is("REST APIs"));
    }
}
