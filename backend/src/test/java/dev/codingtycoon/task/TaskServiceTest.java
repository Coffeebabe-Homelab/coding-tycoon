package dev.codingtycoon.task;

import dev.codingtycoon.profile.PlayerProfile;
import dev.codingtycoon.profile.ProfileRepository;
import dev.codingtycoon.task.seed.SeedTaskService;
import dev.codingtycoon.user.User;
import dev.codingtycoon.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for TaskService using in-memory fakes, so branches unreachable through
 * the HTTP layer (e.g. the AI path while the stub adapter is active) are covered.
 */
class TaskServiceTest {

    private static final String SUB = "auth0|unit";

    private final InMemoryTaskRepository taskRepository = new InMemoryTaskRepository();
    private final TaskService taskService = new TaskService();
    private Optional<GeneratedTask> generated = Optional.empty();

    @BeforeEach
    void setUp() {
        User user = new User();
        user.id = 1L;
        PlayerProfile profile = new PlayerProfile();
        profile.id = 2L;
        profile.userId = user.id;

        taskService.userRepository = new UserRepository() {
            public Optional<User> findBySub(String sub) {
                return SUB.equals(sub) ? Optional.of(user) : Optional.empty();
            }

            public User save(User u) {
                return u;
            }
        };
        taskService.profileRepository = new ProfileRepository() {
            public Optional<PlayerProfile> findByUserId(Long userId) {
                return Optional.of(profile);
            }

            public PlayerProfile save(PlayerProfile p) {
                return p;
            }
        };
        taskService.taskRepository = taskRepository;
        taskService.seedTaskService = new SeedTaskService();
        taskService.taskAiPort = (language, seniority, topics) -> generated;
    }

    @Test
    void generatedTaskDefaultsToShopfrontWithoutFocusFiles() {
        generated = Optional.of(new GeneratedTask("AI task", "desc", "- ok", "Junior", new String[]{"java"}));

        Task task = taskService.generateTask(SUB);

        assertEquals("AI task", task.title);
        assertEquals("shopfront", task.codebaseKey);
        assertEquals("", task.focusFiles);
    }

    @Test
    void seedTaskCopiesCodebaseScope() {
        Task task = taskService.generateTask(SUB);

        assertEquals("shopfront", task.codebaseKey);
        assertTrue(TaskResponse.from(task).focusFiles().stream().noneMatch(String::isBlank));
    }

    @Test
    void findActiveTaskReturnsEmptyWhenNoneAssigned() {
        assertTrue(taskService.findActiveTask(SUB).isEmpty());
    }

    @Test
    void findActiveTaskReturnsCurrentTask() {
        Task created = taskService.generateTask(SUB);

        assertEquals(Optional.of(created), taskService.findActiveTask(SUB));
    }

    @Test
    void responseSplitsFocusFiles() {
        Task task = new Task();
        task.title = "t";
        task.difficulty = "Junior";
        task.focusFiles = "a/A.java, b/B.java";

        assertEquals(List.of("a/A.java", "b/B.java"), TaskResponse.from(task).focusFiles());
    }

    /** Stores a single task, which is all these tests need. */
    private static final class InMemoryTaskRepository implements TaskRepository {
        private Task stored;

        public Optional<Task> findTodayForProfile(Long profileId) {
            return Optional.ofNullable(stored);
        }

        public Optional<Task> findTaskById(Long id) {
            return Optional.ofNullable(stored);
        }

        public Task save(Task task) {
            stored = task;
            return task;
        }
    }
}
