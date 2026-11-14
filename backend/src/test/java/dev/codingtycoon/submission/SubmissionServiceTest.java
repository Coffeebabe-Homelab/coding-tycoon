package dev.codingtycoon.submission;

import dev.codingtycoon.codebase.CodebaseRepository;
import dev.codingtycoon.exception.UnprocessableException;
import dev.codingtycoon.submission.CreateSubmissionRequest.FileContent;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskService;
import dev.codingtycoon.task.TaskStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mockito;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;

class SubmissionServiceTest {

    private static final String SUB = "auth0|unit";
    private static final Long TASK_ID = 7L;
    private static final Long PROFILE_ID = 2L;
    private static final String CONTROLLER = "src/main/java/com/shopfront/user/UserController.java";
    private static final String SERVICE = "src/main/java/com/shopfront/user/UserService.java";
    private static final String ORIGINAL = "class UserController {}";

    private final TaskService taskService = Mockito.mock(TaskService.class);
    private final CodebaseRepository codebaseRepository = Mockito.mock(CodebaseRepository.class);
    private final SubmissionRepository submissionRepository = Mockito.mock(SubmissionRepository.class);
    private final SubmissionService service = new SubmissionService();
    private Task task;

    @BeforeEach
    void setUp() {
        task = new Task();
        task.id = TASK_ID;
        task.playerProfileId = PROFILE_ID;
        task.status = TaskStatus.IN_PROGRESS;
        task.focusFiles = CONTROLLER + "," + SERVICE;

        Mockito.when(taskService.findActiveTask(SUB)).thenReturn(Optional.of(task));
        Mockito.when(codebaseRepository.readFile(any(), any())).thenReturn(Optional.of(ORIGINAL));
        Mockito.when(submissionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.taskService = taskService;
        service.codebaseRepository = codebaseRepository;
        service.submissionRepository = submissionRepository;
    }

    @Test
    void pushStoresTheFilesAsTheNextAttemptAndSubmitsTheTask() {
        Mockito.when(submissionRepository.countForTask(TASK_ID)).thenReturn(1L);

        Submission saved = service.push(SUB, request("feat(users): list users",
                new FileContent(SERVICE, "changed service"), new FileContent(CONTROLLER, "changed controller")));

        assertEquals(TASK_ID, saved.taskId);
        assertEquals(PROFILE_ID, saved.playerProfileId);
        assertEquals(2, saved.attemptNumber);
        assertEquals("feat(users): list users", saved.commitMessage);
        assertEquals(List.of(CONTROLLER, SERVICE), saved.files.stream().map(file -> file.path).toList());
        Mockito.verify(taskService).submit(TASK_ID);
    }

    @Test
    void pushTrimsTheCommitMessage() {
        assertEquals("fix: typo", service.push(SUB, request("  fix: typo \n", changedController())).commitMessage);
    }

    @Test
    void pushWithoutABodyIsRejected() {
        assertRejected(null, "body is required");
    }

    @Test
    void pushWithoutAnActiveTaskIsRejected() {
        Mockito.when(taskService.findActiveTask(SUB)).thenReturn(Optional.empty());

        assertRejected(request("feat: x", changedController()), "No active task");
    }

    @ParameterizedTest
    @EnumSource(value = TaskStatus.class, names = {"IN_PROGRESS", "CHANGES_REQUESTED"}, mode = EnumSource.Mode.EXCLUDE)
    void pushIsRejectedUnlessTheTaskIsBeingWorkedOn(TaskStatus status) {
        task.status = status;

        assertRejected(request("feat: x", changedController()), status.name());
    }

    @Test
    void pushIsAllowedAfterChangesWereRequested() {
        task.status = TaskStatus.CHANGES_REQUESTED;

        service.push(SUB, request("fix: review comments", changedController()));

        Mockito.verify(taskService).submit(TASK_ID);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void blankCommitMessageIsRejected(String message) {
        assertRejected(request(message, changedController()), "Commit message");
    }

    @Test
    void commitMessageOverTheLimitIsRejected() {
        assertRejected(request("x".repeat(Submission.MAX_COMMIT_MESSAGE_LENGTH + 1), changedController()), "72");
    }

    @Test
    void commitMessageAtTheLimitIsAccepted() {
        String message = "x".repeat(Submission.MAX_COMMIT_MESSAGE_LENGTH);

        assertEquals(message, service.push(SUB, request(message, changedController())).commitMessage);
    }

    @Test
    void pushWithoutFilesIsRejected() {
        assertRejected(new CreateSubmissionRequest("feat: x", List.of()), "at least one");
        assertRejected(new CreateSubmissionRequest("feat: x", null), "at least one");
    }

    @Test
    void duplicatePathIsRejected() {
        assertRejected(request("feat: x", changedController(), changedController()), "more than once");
    }

    @ParameterizedTest
    @ValueSource(strings = {"src/main/java/com/shopfront/product/Product.java", "../application.properties", ""})
    void fileOutsideTheTaskIsRejected(String path) {
        assertRejected(request("feat: x", new FileContent(path, "changed")), "not a file of this task");
    }

    @Test
    void missingPathIsRejected() {
        assertRejected(request("feat: x", new FileContent(null, "changed")), "not a file of this task");
    }

    @Test
    void missingContentIsRejected() {
        assertRejected(request("feat: x", new FileContent(CONTROLLER, null)), "no content");
    }

    @Test
    void fileOverTheSizeLimitIsRejected() {
        String tooBig = "é".repeat(SubmissionService.MAX_FILE_BYTES / 2 + 1); // 2 bytes each in UTF-8

        assertRejected(request("feat: x", new FileContent(CONTROLLER, tooBig)), "64 KB");
    }

    @Test
    void unchangedFileIsRejected() {
        assertRejected(request("feat: x", new FileContent(CONTROLLER, ORIGINAL)), "unchanged");
    }

    @Test
    void fileMissingFromTheCodebaseIsRejected() {
        Mockito.when(codebaseRepository.readFile(any(), any())).thenReturn(Optional.empty());

        assertRejected(request("feat: x", changedController()), "not a file of this task");
    }

    @Test
    void latestReturnsTheActiveTasksLastPush() {
        Submission last = new Submission();
        Mockito.when(submissionRepository.findLatestForTask(TASK_ID)).thenReturn(Optional.of(last));

        assertEquals(Optional.of(last), service.findLatest(SUB));
    }

    @Test
    void latestIsEmptyWithoutAnActiveTask() {
        Mockito.when(taskService.findActiveTask(SUB)).thenReturn(Optional.empty());

        assertTrue(service.findLatest(SUB).isEmpty());
    }

    private void assertRejected(CreateSubmissionRequest request, String messagePart) {
        UnprocessableException e = assertThrows(UnprocessableException.class, () -> service.push(SUB, request));

        assertTrue(e.getMessage().contains(messagePart), "message was: " + e.getMessage());
        Mockito.verify(submissionRepository, Mockito.never()).save(any());
        Mockito.verify(taskService, Mockito.never()).submit(any());
    }

    private static FileContent changedController() {
        return new FileContent(CONTROLLER, "class UserController { /* changed */ }");
    }

    private static CreateSubmissionRequest request(String message, FileContent... files) {
        return new CreateSubmissionRequest(message, Arrays.asList(files));
    }
}
