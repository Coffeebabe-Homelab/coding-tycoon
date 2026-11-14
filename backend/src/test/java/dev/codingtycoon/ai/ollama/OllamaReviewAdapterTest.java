package dev.codingtycoon.ai.ollama;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.codingtycoon.review.ReviewFile;
import dev.codingtycoon.review.ReviewRequest;
import dev.codingtycoon.review.ReviewResult;
import dev.codingtycoon.review.ReviewVerdict;
import dev.codingtycoon.review.Severity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Prompt building and answer mapping, without fault tolerance (see OllamaReviewAdapterFaultToleranceTest). */
class OllamaReviewAdapterTest {

    static final String PATH = "src/main/java/com/shopfront/user/UserController.java";
    static final ReviewRequest REQUEST = new ReviewRequest(2, "List users", "Add GET /api/users",
            List.of("Returns 200", "Has a test"),
            List.of(new ReviewFile(PATH, "class UserController {}\n")),
            List.of(new ReviewFile(PATH, "class UserController {\n  List<User> list() { return null; }\n}\n")),
            "Be specific.");
    static final String VALID = """
            {"verdict":"CHANGES_REQUESTED","summary":"Close, one fix.",
             "comments":[{"path":"%s","line":2,"severity":"MUST_FIX","body":"Return the users, not null."},
                         {"path":"%s","line":1,"severity":"PRAISE","body":"Clear class name."}],
             "criteria":[{"position":1,"met":false},{"position":0,"met":true}]}""".formatted(PATH, PATH);

    private final OllamaReviewAdapter adapter = adapter();

    private static OllamaReviewAdapter adapter() {
        OllamaReviewAdapter adapter = new OllamaReviewAdapter();
        adapter.objectMapper = new ObjectMapper();
        return adapter;
    }

    @Test
    void aValidAnswerBecomesAResult() {
        ReviewResult result = adapter.parse(VALID, 2).orElseThrow();

        assertEquals(ReviewVerdict.CHANGES_REQUESTED, result.verdict());
        assertEquals("Close, one fix.", result.summary());
        assertEquals(new ReviewResult.Comment(PATH, 2, Severity.MUST_FIX, "Return the users, not null."),
                result.comments().getFirst());
        assertEquals(List.of(true, false), result.criteriaMet(), "ordered by position");
    }

    @Test
    void aCodeFenceAroundTheJsonIsIgnored() {
        assertTrue(adapter.parse("```json\n" + VALID + "\n```", 2).isPresent());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "not json",
            "{\"summary\":\"x\",\"comments\":[],\"criteria\":[]}",
            "{\"verdict\":\"MAYBE\",\"summary\":\"x\",\"comments\":[],\"criteria\":[]}",
            "{\"verdict\":\"APPROVED\",\"summary\":\" \",\"comments\":[],\"criteria\":[]}",
            "{\"verdict\":\"APPROVED\",\"summary\":\"x\",\"criteria\":[]}",
            "{\"verdict\":\"APPROVED\",\"summary\":\"x\",\"comments\":[{\"path\":\"a\",\"line\":1,\"severity\":\"NIT\",\"body\":\"b\"}],\"criteria\":[]}",
            "{\"verdict\":\"APPROVED\",\"summary\":\"x\",\"comments\":[{\"path\":\"a\",\"line\":\"one\",\"severity\":\"PRAISE\",\"body\":\"b\"}],\"criteria\":[]}",
            "{\"verdict\":\"APPROVED\",\"summary\":\"x\",\"comments\":[{\"line\":1,\"severity\":\"PRAISE\",\"body\":\"b\"}],\"criteria\":[]}",
            "{\"verdict\":\"APPROVED\",\"summary\":\"x\",\"comments\":[],\"criteria\":{}}"
    })
    void anAnswerWithTheWrongShapeIsNoResult(String answer) {
        assertEquals(Optional.empty(), adapter.parse(answer, 0));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "[{\"position\":0,\"met\":true}]",
            "[{\"position\":0,\"met\":true},{\"position\":0,\"met\":false}]",
            "[{\"position\":0,\"met\":true},{\"position\":2,\"met\":false}]",
            "[{\"position\":0,\"met\":true},{\"position\":1,\"met\":\"yes\"}]"
    })
    void criteriaMustCoverEveryPositionOnce(String criteria) {
        String answer = "{\"verdict\":\"APPROVED\",\"summary\":\"x\",\"comments\":[],\"criteria\":" + criteria + "}";

        assertEquals(Optional.empty(), adapter.parse(answer, 2));
    }

    @Test
    void thePromptHasTheTicketNumberedLinesAndGuidelines() {
        String prompt = adapter.prompt(REQUEST);

        assertTrue(prompt.contains("Title: List users"));
        assertTrue(prompt.contains("0: Returns 200\n1: Has a test"));
        assertTrue(prompt.contains("attempt 2"));
        assertTrue(prompt.contains("BEGIN FILE " + PATH + "\n1 | class UserController {\n2 |   List<User> list()"));
        assertTrue(prompt.contains("Be specific."));
        assertFalse(prompt.contains("{{"), "every placeholder is filled");
    }

    @Test
    void placeholdersInThePushedCodeAreNotFilled() {
        ReviewRequest sneaky = new ReviewRequest(1, "T", "D", List.of("One"), List.of(),
                List.of(new ReviewFile(PATH, "// {{guidelines}}\n")), "SECRET RULES");

        String prompt = adapter.prompt(sneaky);

        assertEquals(1, prompt.split("SECRET RULES", -1).length - 1, "the guidelines appear once");
        assertTrue(prompt.contains("1 | // {{guidelines}}"));
    }

    @Test
    void aPromptOverTheContextBudgetIsDetected() {
        adapter.numCtx = 100;
        adapter.numPredict = 50;

        assertTrue(adapter.tooLong("x".repeat(151)));
        assertFalse(adapter.tooLong("x".repeat(150)));
    }
}
