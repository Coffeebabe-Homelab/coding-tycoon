package dev.codingtycoon.task;

import dev.codingtycoon.exception.ConflictException;
import dev.codingtycoon.progress.ProgressTestData;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Real parallel transactions on PostgreSQL: a player must never end up with two active tasks. */
@QuarkusTest
class TaskConcurrencyTest {

    private static final String SUB = "auth0|concurrency-user";
    private static final int CALLERS = 8;

    @Inject
    TaskService taskService;

    @Inject
    JpaTaskRepository taskRepository;

    @Inject
    ProgressTestData testData;

    private Long profileId;

    @BeforeEach
    void setUp() {
        testData.clear();
        profileId = testData.createProfile(SUB);
    }

    @Test
    void parallelGetOrCreateCreatesOneTaskAndAllCallersGetIt() throws Exception {
        List<Future<Pair<Task, Boolean>>> results = runInParallel(() -> taskService.getOrCreateTodayTask(SUB));

        long created = 0;
        Long firstId = null;
        for (Future<Pair<Task, Boolean>> result : results) {
            Pair<Task, Boolean> pair = result.get();
            created += pair.second() ? 1 : 0;
            firstId = firstId == null ? pair.first().id : firstId;
            assertEquals(firstId, pair.first().id);
        }

        assertEquals(1, created);
        assertEquals(1, taskRepository.count("playerProfileId", profileId));
    }

    @Test
    void parallelGenerateCreatesOneTaskAndTheRestConflict() throws Exception {
        List<Future<Task>> results = runInParallel(() -> taskService.generateTask(SUB));

        int succeeded = 0;
        for (Future<Task> result : results) {
            try {
                result.get();
                succeeded++;
            } catch (ExecutionException e) {
                assertInstanceOf(ConflictException.class, e.getCause());
            }
        }

        assertEquals(1, succeeded);
        assertEquals(1, taskRepository.count("playerProfileId", profileId));
    }

    @Test
    void databaseRejectsASecondActiveTask() {
        testData.createTask(profileId, "Active", TaskStatus.ASSIGNED);

        assertThrows(ConstraintViolationException.class,
                () -> testData.createTask(profileId, "Duplicate", TaskStatus.IN_PROGRESS));
    }

    @Test
    void approvedTasksDoNotBlockTheNextTask() {
        testData.createTask(profileId, "Done", TaskStatus.APPROVED);
        testData.createTask(profileId, "Also done", TaskStatus.APPROVED);

        assertTrue(taskService.getOrCreateTodayTask(SUB).second());
    }

    private <T> List<Future<T>> runInParallel(Callable<T> call) throws InterruptedException {
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService pool = Executors.newFixedThreadPool(CALLERS)) {
            List<Future<T>> futures = new ArrayList<>();
            for (int i = 0; i < CALLERS; i++) {
                futures.add(pool.submit(() -> {
                    start.await(5, TimeUnit.SECONDS);
                    return call.call();
                }));
            }
            start.countDown();
            return futures;
        }
    }
}
