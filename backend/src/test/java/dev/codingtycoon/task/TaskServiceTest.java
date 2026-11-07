package dev.codingtycoon.task;

import dev.codingtycoon.profile.PlayerProfile;
import dev.codingtycoon.profile.ProfileRepository;
import dev.codingtycoon.task.seed.SeedTaskService;
import dev.codingtycoon.user.User;
import dev.codingtycoon.user.UserRepository;
import jakarta.ws.rs.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

    private final TaskRepository taskRepository = Mockito.mock(TaskRepository.class);
    private final UserRepository userRepository = Mockito.mock(UserRepository.class);
    private final ProfileRepository profileRepository = Mockito.mock(ProfileRepository.class);
    private final TaskAiPort taskAiPort = Mockito.mock(TaskAiPort.class);
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

    @Test
    void responseSplitsFocusFiles() {
        Task task = new Task();
        task.title = "t";
        task.difficulty = "Junior";
        task.focusFiles = "a/A.java, b/B.java";

        assertEquals(List.of("a/A.java", "b/B.java"), TaskResponse.from(task).focusFiles());
    }
}
