package dev.codingtycoon.task;

import dev.codingtycoon.exception.UnprocessableException;
import dev.codingtycoon.profile.PlayerProfile;
import dev.codingtycoon.profile.ProfileRepository;
import dev.codingtycoon.progress.ProgressService;
import dev.codingtycoon.task.seed.SeedTaskService;
import dev.codingtycoon.user.User;
import dev.codingtycoon.user.UserRepository;
import jakarta.ws.rs.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mockito;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;

/**
 * Unit tests for TaskService using Mockito mocks, so branches unreachable through
 * the HTTP layer (e.g. the AI path while the stub adapter is active) are covered.
 */
class TaskServiceTest {

    private static final String SUB = "auth0|unit";
    private static final Long USER_ID = 1L;
    private static final Long PROFILE_ID = 2L;
    private static final Long TASK_ID = 3L;
    private static final Map<TaskStatus, Set<TaskStatus>> ALLOWED = Map.of(
            TaskStatus.ASSIGNED, Set.of(TaskStatus.IN_PROGRESS),
            TaskStatus.IN_PROGRESS, Set.of(TaskStatus.SUBMITTED),
            TaskStatus.SUBMITTED, Set.of(TaskStatus.APPROVED, TaskStatus.CHANGES_REQUESTED),
            TaskStatus.CHANGES_REQUESTED, Set.of(TaskStatus.SUBMITTED),
            TaskStatus.APPROVED, Set.of()
    );

    private final TaskRepository taskRepository = Mockito.mock(TaskRepository.class);
    private final UserRepository userRepository = Mockito.mock(UserRepository.class);
    private final ProfileRepository profileRepository = Mockito.mock(ProfileRepository.class);
    private final TaskAiPort taskAiPort = Mockito.mock(TaskAiPort.class);
    private final ProgressService progressService = Mockito.mock(ProgressService.class);
    private final TaskService taskService = new TaskService();

    @BeforeEach
    void setUp() {
        User user = new User();
        user.id = USER_ID;
        PlayerProfile profile = new PlayerProfile();
        profile.id = PROFILE_ID;
        profile.userId = USER_ID;

        Mockito.when(userRepository.findBySub(SUB)).thenReturn(Optional.of(user));
        Mockito.when(profileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(profile));
        Mockito.when(taskAiPort.generate(any(), any(), any())).thenReturn(Optional.empty());

        taskService.userRepository = userRepository;
        taskService.profileRepository = profileRepository;
        taskService.taskRepository = taskRepository;
        taskService.seedTaskService = new SeedTaskService();
        taskService.taskAiPort = taskAiPort;
        taskService.progressService = progressService;
    }

    @Test
    void generatedTaskDefaultsToShopfrontWithoutFocusFiles() {
        Mockito.when(taskAiPort.generate(any(), any(), any())).thenReturn(Optional.of(
                new GeneratedTask("AI task", "desc", "- ok", "Junior", new String[]{"java"})));

        Task task = taskService.generateTask(SUB);

        assertEquals("AI task", task.title);
        assertEquals("shopfront", task.codebaseKey);
        assertEquals("", task.focusFiles);
        Mockito.verify(taskRepository).save(task);
    }

    @Test
    void seedTaskCopiesCodebaseScope() {
        Task task = taskService.generateTask(SUB);

        assertEquals("shopfront", task.codebaseKey);
        assertTrue(TaskResponse.from(task).focusFiles().stream().noneMatch(String::isBlank));
        Mockito.verify(taskRepository).save(task);
    }

    @Test
    void findActiveTaskReturnsEmptyWhenNoneAssigned() {
        assertTrue(taskService.findActiveTask(SUB).isEmpty());
    }

    @Test
    void findActiveTaskReturnsCurrentTask() {
        Task created = taskService.generateTask(SUB);
        Mockito.when(taskRepository.findTodayForProfile(PROFILE_ID)).thenReturn(Optional.of(created));

        assertEquals(Optional.of(created), taskService.findActiveTask(SUB));
    }

    @Test
    void unknownUserIsNotFound() {
        assertThrows(NotFoundException.class, () -> taskService.findActiveTask("auth0|nobody"));
    }

    @Test
    void missingProfileIsNotFound() {
        Mockito.when(profileRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> taskService.findActiveTask(SUB));
    }

    @ParameterizedTest
    @MethodSource("allowedTransitions")
    void allowedTransitionUpdatesAndSavesTask(TaskStatus from, TaskStatus to) {
        Task task = storedTask(from);

        assertSame(task, taskService.transitionStatus(TASK_ID, to));

        assertEquals(to, task.status);
        Mockito.verify(taskRepository).save(task);
    }

    @ParameterizedTest
    @MethodSource("forbiddenTransitions")
    void forbiddenTransitionIsRejectedAndNothingChanges(TaskStatus from, TaskStatus to) {
        Task task = storedTask(from);

        assertThrows(UnprocessableException.class, () -> taskService.transitionStatus(TASK_ID, to));

        assertEquals(from, task.status);
        Mockito.verify(taskRepository, Mockito.never()).save(any());
        Mockito.verifyNoInteractions(progressService);
    }

    @Test
    void approvalAwardsXp() {
        Task task = storedTask(TaskStatus.SUBMITTED);

        taskService.transitionStatus(TASK_ID, TaskStatus.APPROVED);

        Mockito.verify(progressService).awardForApproval(task);
    }

    @Test
    void otherTransitionsAwardNoXp() {
        storedTask(TaskStatus.SUBMITTED);

        taskService.transitionStatus(TASK_ID, TaskStatus.CHANGES_REQUESTED);

        Mockito.verifyNoInteractions(progressService);
    }

    @Test
    void transitionOfUnknownTaskIsNotFound() {
        assertThrows(NotFoundException.class, () -> taskService.transitionStatus(TASK_ID, TaskStatus.IN_PROGRESS));
    }

    @Test
    void responseSplitsFocusFiles() {
        Task task = new Task();
        task.title = "t";
        task.difficulty = "Junior";
        task.focusFiles = "a/A.java, b/B.java";

        assertEquals(List.of("a/A.java", "b/B.java"), TaskResponse.from(task).focusFiles());
    }

    private Task storedTask(TaskStatus status) {
        Task task = new Task();
        task.id = TASK_ID;
        task.status = status;
        Mockito.when(taskRepository.findTaskById(TASK_ID)).thenReturn(Optional.of(task));
        return task;
    }

    static Stream<Arguments> allowedTransitions() {
        return ALLOWED.entrySet().stream()
                .flatMap(e -> e.getValue().stream().map(to -> Arguments.of(e.getKey(), to)));
    }

    /** Every pair of statuses not listed in ALLOWED, so a new status can't slip through untested. */
    static Stream<Arguments> forbiddenTransitions() {
        return Arrays.stream(TaskStatus.values()).flatMap(from -> Arrays.stream(TaskStatus.values())
                .filter(to -> !ALLOWED.get(from).contains(to))
                .map(to -> Arguments.of(from, to)));
    }
}
