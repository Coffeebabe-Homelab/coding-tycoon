package dev.codingtycoon.progress;

import dev.codingtycoon.profile.ProfileService;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import org.jboss.logging.Logger;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;

/**
 * Domain service for player progression: awards XP into the ledger and derives totals from it.
 * A "day" is a UTC calendar day.
 */
@ApplicationScoped
public class ProgressService {

    /** XP awarded when a task is approved. */
    public static final int XP_PER_APPROVED_TASK = 100;

    /** Extra XP when the first push is approved. Later attempts earn none, but are never capped. */
    public static final int XP_FIRST_TRY_BONUS = 50;

    /** Shown until levels and XP thresholds are defined; only this value changes when they are. */
    static final String MOCK_LEVEL = "X";

    private static final Logger LOG = Logger.getLogger(ProgressService.class);

    @Inject
    XpEventRepository xpEventRepository;

    @Inject
    ProfileService profileService;

    @Inject
    TaskRepository taskRepository;

    /**
     * Records the approval awards for a task: the ticket XP, plus the first-try bonus on attempt 1.
     * Safe to call repeatedly: each award is paid once per task.
     *
     * @param task          the task that reached APPROVED
     * @param attemptNumber the attempt that was approved, from 1
     */
    @Transactional
    public void awardForApproval(Task task, int attemptNumber) {
        award(task, XpReason.TASK_APPROVED, XP_PER_APPROVED_TASK);
        if (attemptNumber == 1) {
            award(task, XpReason.FIRST_TRY_BONUS, XP_FIRST_TRY_BONUS);
        }
    }

    private void award(Task task, XpReason reason, int amount) {
        if (xpEventRepository.exists(task.id, reason)) {
            LOG.warnf("%s XP for task %d already awarded, skipping", reason, task.id);
            return;
        }
        XpEvent event = new XpEvent();
        event.playerProfileId = task.playerProfileId;
        event.taskId = task.id;
        event.amount = amount;
        event.reason = reason;
        xpEventRepository.save(event);
        LOG.infof("Awarded %d %s XP to profile %d for task %d", amount, reason, task.playerProfileId, task.id);
    }

    /**
     * Returns the authenticated player's XP totals, approval streak and today's approved task.
     *
     * @param sub the Auth0 subject claim
     * @return the player's progress
     * @throws NotFoundException if the player has no profile
     */
    public ProgressResponse getProgress(String sub) {
        Long profileId = profileService.getProfile(sub).id;
        List<XpEvent> events = xpEventRepository.listForProfile(profileId);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        long totalXp = events.stream().mapToLong(e -> e.amount).sum();
        List<XpEvent> todayEvents = events.stream()
                .filter(e -> e.createdAt.toLocalDate().equals(today))
                .toList();
        long xpToday = todayEvents.stream().mapToLong(e -> e.amount).sum();
        List<LocalDate> approvalDays = events.stream()
                .filter(e -> e.reason == XpReason.TASK_APPROVED)
                .map(e -> e.createdAt.toLocalDate())
                .toList();
        Streak streak = StreakCalculator.calculate(approvalDays, today);
        return new ProgressResponse(MOCK_LEVEL, totalXp, xpToday, streak.current(), streak.longest(),
                approvedTodayTaskTitle(todayEvents));
    }

    // The active-task endpoint skips APPROVED tasks, so End of Day reads today's approved task from here.
    private String approvedTodayTaskTitle(List<XpEvent> todayEvents) {
        return todayEvents.stream()
                .filter(e -> e.reason == XpReason.TASK_APPROVED)
                .max(Comparator.comparing(e -> e.createdAt))
                .flatMap(e -> taskRepository.findTaskById(e.taskId))
                .map(task -> task.title)
                .orElse(null);
    }
}
