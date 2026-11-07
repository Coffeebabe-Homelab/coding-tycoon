package dev.codingtycoon.topic;

import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.hasSize;

/** Shows the Mockito setup works: {@code @InjectMock} replaces a port for the whole request. */
@QuarkusTest
class TopicMockingTest {

    @InjectMock
    TopicRepository topicRepository;

    @Test
    void injectedMockReplacesThePortBehindTheEndpoint() {
        Topic topic = new Topic();
        topic.name = "Mocked";
        topic.slug = "mocked";
        Mockito.when(topicRepository.listTopics()).thenReturn(List.of(topic));

        given()
                .when().get("/api/topics")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("[0].slug", is("mocked"));

        Mockito.verify(topicRepository).listTopics();
    }

    @Test
    void unexpectedFailureBecomes500WithoutLeakingDetails() {
        Mockito.when(topicRepository.listTopics()).thenThrow(new IllegalStateException("db password is hunter2"));

        given()
                .when().get("/api/topics")
                .then()
                .statusCode(500)
                .body("error", is("InternalServerError"))
                .body("message", is("An unexpected error occurred"))
                .body("status", is(500));
    }
}
