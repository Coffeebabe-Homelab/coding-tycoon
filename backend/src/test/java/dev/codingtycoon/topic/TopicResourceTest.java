package dev.codingtycoon.topic;

import dev.codingtycoon.profile.JpaProfileRepository;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.hasSize;

/**
 * Integration tests for GET /api/topics.
 * No authentication required — topics are public data.
 */
@QuarkusTest
class TopicResourceTest {

    @Inject
    JpaTopicRepository topicRepository;

    @Inject
    JpaProfileRepository profileRepository;

    @Inject
    EntityManager em;

    @BeforeEach
    @Transactional
    void setUp() {
        // Flyway seed data does not run in test (H2 drop-and-create mode).
        // Clean join table first, then profiles, then topics — respects FK constraints.
        em.createNativeQuery("DELETE FROM player_profile_topics").executeUpdate();
        profileRepository.deleteAll();
        topicRepository.deleteAll();

        Topic t1 = new Topic();
        t1.name = "REST APIs";
        t1.slug = "rest-apis";
        topicRepository.persist(t1);

        Topic t2 = new Topic();
        t2.name = "CRUD";
        t2.slug = "crud";
        topicRepository.persist(t2);

        Topic t3 = new Topic();
        t3.name = "OOP";
        t3.slug = "oop";
        topicRepository.persist(t3);
    }

    @Test
    void listTopicsReturnsAllTopics() {
        given()
                .when().get("/api/topics")
                .then()
                .statusCode(200)
                .body("$", hasSize(3));
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
                .body("[0].name", is("REST APIs"))
                .body("[0].slug", is("rest-apis"));
    }
}
