package dev.codingtycoon.ai.ollama;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.codingtycoon.task.GeneratedTask;
import dev.langchain4j.model.chat.ChatModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.net.ConnectException;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;

/** Parsing and error mapping, without fault tolerance (see OllamaTaskAdapterFaultToleranceTest). */
class OllamaTaskAdapterTest {

    static final String VALID = """
            {"title":"List users","description":"Add an endpoint.","acceptanceCriteria":"- returns 200",
             "difficulty":"Junior","tags":["rest-apis","crud"]}""";

    private final ChatModel chatModel = Mockito.mock(ChatModel.class);
    private final OllamaTaskAdapter adapter = new OllamaTaskAdapter();

    @BeforeEach
    void setUp() {
        adapter.chatModel = chatModel;
        adapter.objectMapper = new ObjectMapper();
    }

    @Test
    void aValidAnswerBecomesATask() {
        Mockito.when(chatModel.chat(anyString())).thenReturn(VALID);

        GeneratedTask task = adapter.generate("Java", "Junior", List.of("rest-apis")).orElseThrow();

        assertEquals("List users", task.title());
        assertEquals("- returns 200", task.acceptanceCriteria());
        assertArrayEquals(new String[]{"rest-apis", "crud"}, task.tags());
    }

    @Test
    void thePromptCarriesThePlayersProfile() {
        Mockito.when(chatModel.chat(anyString())).thenReturn(VALID);

        adapter.generate("Java", "Junior", List.of("rest-apis", "crud"));

        ArgumentCaptor<String> prompt = ArgumentCaptor.forClass(String.class);
        Mockito.verify(chatModel).chat(prompt.capture());
        assertTrue(prompt.getValue().contains("learning Java"));
        assertTrue(prompt.getValue().contains("seniority level is: Junior"));
        assertTrue(prompt.getValue().contains("topics are: rest-apis, crud"));
    }

    @Test
    void aCodeFenceAroundTheJsonIsIgnored() {
        assertTrue(adapter.parse("```json\n" + VALID + "\n```").isPresent());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "not json at all",
            "{\"title\":\"x\"}",
            "{\"title\":\"x\",\"description\":\"d\",\"acceptanceCriteria\":\"- c\",\"difficulty\":\"Junior\",\"tags\":\"x\"}",
            "{\"title\":\" \",\"description\":\"d\",\"acceptanceCriteria\":\"- c\",\"difficulty\":\"Junior\",\"tags\":[]}",
            "```"
    })
    void anUnusableAnswerIsNoTask(String answer) {
        assertEquals(Optional.empty(), adapter.parse(answer));
    }

    @Test
    void anUnreachableServerIsRetryable() {
        Mockito.when(chatModel.chat(anyString()))
                .thenThrow(new RuntimeException("wrapped", new ConnectException("refused")));

        assertThrows(AiUnavailableException.class, () -> adapter.generate("Java", "Junior", List.of()));
    }

    @Test
    void otherFailuresAreNotRetryable() {
        IllegalStateException failure = new IllegalStateException("model error");
        Mockito.when(chatModel.chat(anyString())).thenThrow(failure);

        assertSame(failure, assertThrows(IllegalStateException.class,
                () -> adapter.generate("Java", "Junior", List.of())));
    }

    @Test
    void theFallbackIsNoTask() {
        assertEquals(Optional.empty(), adapter.noTask("Java", "Junior", List.of(), new RuntimeException()));
    }
}
