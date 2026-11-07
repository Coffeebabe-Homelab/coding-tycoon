package dev.codingtycoon.codebase;

import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskService;
import jakarta.ws.rs.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit tests for CodebaseService with a mocked repository and TaskService.
 */
class CodebaseServiceTest {

    private static final String SUB = "auth0|codebase-unit";

    private final TaskService taskService = Mockito.mock(TaskService.class);
    private final CodebaseRepository codebaseRepository = Mockito.mock(CodebaseRepository.class);
    private final CodebaseService service = new CodebaseService();
    private Task task;

    @BeforeEach
    void setUp() {
        task = new Task();
        task.codebaseKey = "demo";
        task.focusFiles = "src/A.java";

        Mockito.when(taskService.findActiveTask(SUB)).thenReturn(Optional.of(task));
        Mockito.when(codebaseRepository.listFiles("demo"))
                .thenReturn(List.of("README.md", "src/A.java", "src/Gone.java"));
        Mockito.when(codebaseRepository.readFile("demo", "README.md")).thenReturn(Optional.of("# Demo"));
        Mockito.when(codebaseRepository.readFile("demo", "src/A.java")).thenReturn(Optional.of("class A {}"));

        service.taskService = taskService;
        service.codebaseRepository = codebaseRepository;
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
        // The allow-list is the security boundary: an unlisted path must never reach the repository.
        Mockito.verify(codebaseRepository, Mockito.never()).readFile("demo", "../secret.properties");
    }

    @Test
    void readFileIndexedButMissingIsNotFound() {
        assertThrows(NotFoundException.class, () -> service.readFile(SUB, "src/Gone.java"));
    }

    @Test
    void noActiveTaskIsNotFound() {
        Mockito.when(taskService.findActiveTask(SUB)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.listFiles(SUB));
        assertThrows(NotFoundException.class, () -> service.readFile(SUB, "README.md"));
    }

    @Test
    void unknownCodebaseIsNotFound() {
        task.codebaseKey = "missing";

        assertThrows(NotFoundException.class, () -> service.listFiles(SUB));
    }
}
