package dev.codingtycoon.progress;

import dev.codingtycoon.task.Task;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** Integration tests for XP awarding and progress totals. */
@QuarkusTest
class ProgressServiceTest {

    private static final String TEST_SUB = "auth0|progress-service-user";

    @Inject
    ProgressService progressService;

    @Inject
    JpaXpEventRepository xpEventRepository;

    @Inject
    ProgressTestData testData;

    private Long profileId;

    @BeforeEach
    void setUp() {
        testData.clear();
        profileId = testData.createProfile(TEST_SUB);
    }

    @Test
    void awardForApprovalRecordsOneTaskApprovedEvent() {
        Task task = testData.createTask(profileId);

        progressService.awardForApproval(task);

        var events = xpEventRepository.listForProfile(profileId);
        assertEquals(1, events.size());
        assertEquals(ProgressService.XP_PER_APPROVED_TASK, events.getFirst().amount);
        assertEquals(XpReason.TASK_APPROVED, events.getFirst().reason);
        assertEquals(task.id, events.getFirst().taskId);
    }

    @Test
    void awardForApprovalIsIdempotent() {
        Task task = testData.createTask(profileId);

        progressService.awardForApproval(task);
        progressService.awardForApproval(task);

        assertEquals(1, xpEventRepository.listForProfile(profileId).size());
    }

    @Test
    void getProgressWithoutEventsReturnsZeros() {
        var progress = progressService.getProgress(TEST_SUB);

        assertEquals(0, progress.totalXp());
        assertEquals(0, progress.xpToday());
        assertEquals(0, progress.currentStreak());
        assertEquals(0, progress.longestStreak());
        assertNull(progress.approvedTodayTaskTitle());
    }

    @Test
    void getProgressSumsTotalAndOnlyTodayForXpToday() {
        progressService.awardForApproval(testData.createTask(profileId));
        LocalDateTime yesterday = LocalDateTime.now(ZoneOffset.UTC).minusDays(1);
        testData.createEvent(profileId, testData.createTask(profileId), yesterday);

        var progress = progressService.getProgress(TEST_SUB);

        assertEquals(2 * ProgressService.XP_PER_APPROVED_TASK, progress.totalXp());
        assertEquals(ProgressService.XP_PER_APPROVED_TASK, progress.xpToday());
    }

    @Test
    void getProgressReturnsTitleOfTaskApprovedTodayOnly() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        testData.createEvent(profileId, testData.createTask(profileId, "Yesterday's task"), now.minusDays(1));
        assertNull(progressService.getProgress(TEST_SUB).approvedTodayTaskTitle());

        testData.createEvent(profileId, testData.createTask(profileId, "Today's task"), now);

        assertEquals("Today's task", progressService.getProgress(TEST_SUB).approvedTodayTaskTitle());
    }

    @Test
    void getProgressWithoutProfileThrowsNotFound() {
        assertThrows(NotFoundException.class, () -> progressService.getProgress("auth0|unknown"));
    }
}
