package dev.codingtycoon.codebase;

import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskService;
import jakarta.ws.rs.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit tests for CodebaseService with a fake repository and a stubbed TaskService.
 */
class CodebaseServiceTest {

    private static final String SUB = "auth0|codebase-unit";
    private static final Map<String, String> FILES = Map.of(
            "README.md", "# Demo",
            "src/A.java", "class A {}"
    );

    private final CodebaseService service = new CodebaseService();
    private Optional<Task> activeTask;

    @BeforeEach
    void setUp() {
        Task task = new Task();
        task.codebaseKey = "demo";
        task.focusFiles = "src/A.java";
        activeTask = Optional.of(task);

        service.taskService = new TaskService() {
            @Override
            public Optional<Task> findActiveTask(String sub) {
                return activeTask;
            }
        };
        service.codebaseRepository = new CodebaseRepository() {
            public List<String> listFiles(String codebaseKey) {
                return "demo".equals(codebaseKey) ? List.of("README.md", "src/A.java", "src/Gone.java") : List.of();
            }

            public Optional<String> readFile(String codebaseKey, String path) {
                return Optional.ofNullable(FILES.get(path));
            }
        };
    }

    @Test
    void listFilesReturnsIndexAndFocusFiles() {
        CodebaseFilesResponse response = service.listFiles(SUB);

        assertEquals("demo", response.codebase());
        assertEquals(List.of("src/A.java"), response.focusFiles());
        assertEquals(List.of("README.md", "src/A.java", "src/Gone.java"), response.files());
    }

    @Test
    void readFileReturnsContent() {
        assertEquals(new CodebaseFileResponse("src/A.java", "class A {}"), service.readFile(SUB, "src/A.java"));
    }

    @Test
    void readFileOutsideIndexIsNotFound() {
        assertThrows(NotFoundException.class, () -> service.readFile(SUB, "../secret.properties"));
    }

    @Test
    void readFileIndexedButMissingIsNotFound() {
        assertThrows(NotFoundException.class, () -> service.readFile(SUB, "src/Gone.java"));
    }

    @Test
    void noActiveTaskIsNotFound() {
        activeTask = Optional.empty();

        assertThrows(NotFoundException.class, () -> service.listFiles(SUB));
        assertThrows(NotFoundException.class, () -> service.readFile(SUB, "README.md"));
    }

    @Test
    void unknownCodebaseIsNotFound() {
        activeTask.orElseThrow().codebaseKey = "missing";

        assertThrows(NotFoundException.class, () -> service.listFiles(SUB));
    }
}
