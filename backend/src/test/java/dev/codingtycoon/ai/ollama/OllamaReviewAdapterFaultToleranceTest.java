package dev.codingtycoon.ai.ollama;

import dev.codingtycoon.ai.ReviewAiPortContract;
import dev.codingtycoon.review.ReviewAiPort;
import dev.codingtycoon.review.ReviewFile;
import dev.codingtycoon.review.ReviewRequest;
import dev.langchain4j.model.chat.ChatModel;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.net.ConnectException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;

/** The Ollama reviewer as the app runs it: selected by config, with fault tolerance active. */
@QuarkusTest
@TestProfile(OllamaProfile.class)
class OllamaReviewAdapterFaultToleranceTest extends ReviewAiPortContract {

    // Fits the contract's request: two pushed files, the first with 3 lines, and 3 criteria.
    private static final String FITS_THE_CONTRACT = """
            {"verdict":"CHANGES_REQUESTED","summary":"One fix.",
             "comments":[{"path":"src/main/java/com/shopfront/user/UserController.java","line":2,
                          "severity":"MUST_FIX","body":"Make b final."}],
             "criteria":[{"position":0,"met":true},{"position":1,"met":true},{"position":2,"met":false}]}""";

    @InjectMock
    ChatModel chatModel;

    @Inject
    ReviewAiPort reviewAiPort;

    @Override
    protected ReviewAiPort healthyAdapter() {
        Mockito.when(chatModel.chat(anyString())).thenReturn(FITS_THE_CONTRACT);
        return reviewAiPort;
    }

    @Override
    protected ReviewAiPort failingAdapter() {
        Mockito.when(chatModel.chat(anyString())).thenThrow(new IllegalStateException("model error"));
        return reviewAiPort;
    }

    @Test
    void theOllamaReviewerIsSelected() {
        assertTrue(healthyAdapter().review(request(1)).isPresent());
    }

    @Test
    void anUnreachableServerIsRetriedThenGivesNoReview() {
        Mockito.when(chatModel.chat(anyString()))
                .thenThrow(new RuntimeException("wrapped", new ConnectException("refused")));

        assertTrue(reviewAiPort.review(request(1)).isEmpty());

        Mockito.verify(chatModel, Mockito.times(3)).chat(anyString());
    }

    @Test
    void aSlowModelTimesOutWithoutARetry() {
        Mockito.when(chatModel.chat(anyString())).thenAnswer(invocation -> {
            Thread.sleep(3_000);
            return FITS_THE_CONTRACT;
        });

        assertTrue(reviewAiPort.review(request(1)).isEmpty());

        Mockito.verify(chatModel, Mockito.times(1)).chat(anyString());
    }

    @Test
    void aPromptOverTheContextIsNeverSent() {
        String huge = "int x;\n".repeat(20_000);
        ReviewRequest request = new ReviewRequest(1, "T", "D", List.of("One"), List.of(),
                List.of(new ReviewFile("src/A.java", huge)), "");

        assertTrue(reviewAiPort.review(request).isEmpty());

        Mockito.verifyNoInteractions(chatModel);
    }
}
