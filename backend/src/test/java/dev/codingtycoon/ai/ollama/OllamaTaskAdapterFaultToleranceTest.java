package dev.codingtycoon.ai.ollama;

import dev.codingtycoon.ai.TaskAiPortContract;
import dev.codingtycoon.progress.ProgressTestData;
import dev.codingtycoon.task.TaskAiPort;
import dev.langchain4j.model.chat.ChatModel;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.net.ConnectException;
import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;

/** The Ollama adapter as the app runs it: selected by config, with fault tolerance active. */
@QuarkusTest
@TestProfile(OllamaProfile.class)
class OllamaTaskAdapterFaultToleranceTest extends TaskAiPortContract {

    private static final String SUB = "auth0|ollama-outage";

    @InjectMock
    ChatModel chatModel;

    @Inject
    TaskAiPort taskAiPort;

    @Inject
    ProgressTestData testData;

    @Override
    protected TaskAiPort healthyAdapter() {
        Mockito.when(chatModel.chat(anyString())).thenReturn(OllamaTaskAdapterTest.VALID);
        return taskAiPort;
    }

    @Override
    protected TaskAiPort failingAdapter() {
        Mockito.when(chatModel.chat(anyString())).thenThrow(new IllegalStateException("model error"));
        return taskAiPort;
    }

    @Test
    void theOllamaAdapterIsSelected() {
        assertTrue(healthyAdapter().generate("Java", "Junior", List.of()).isPresent());
    }

    @Test
    void anUnreachableServerIsRetriedThenGivesNoTask() {
        Mockito.when(chatModel.chat(anyString()))
                .thenThrow(new RuntimeException("wrapped", new ConnectException("refused")));

        assertTrue(taskAiPort.generate("Java", "Junior", List.of()).isEmpty());

        Mockito.verify(chatModel, Mockito.times(3)).chat(anyString());
    }

    @Test
    void aSlowModelTimesOutWithoutARetry() {
        Mockito.when(chatModel.chat(anyString())).thenAnswer(invocation -> {
            Thread.sleep(3_000);
            return OllamaTaskAdapterTest.VALID;
        });

        assertTrue(taskAiPort.generate("Java", "Junior", List.of()).isEmpty());

        Mockito.verify(chatModel, Mockito.times(1)).chat(anyString());
    }

    @Test
    @TestSecurity(user = SUB, roles = {})
    @OidcSecurity(claims = {@Claim(key = "sub", value = SUB)})
    void anOllamaOutageStillGivesThePlayerASeedTask() {
        testData.clear();
        testData.createProfile(SUB);
        Mockito.when(chatModel.chat(anyString()))
                .thenThrow(new RuntimeException("wrapped", new ConnectException("refused")));

        given().contentType("application/json")
                .when().post("/api/tasks/generate")
                .then()
                .statusCode(201)
                .body("title", notNullValue())
                .body("codebaseKey", is("shopfront"));
    }
}
