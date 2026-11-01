package dev.codingtycoon.progress;

import dev.codingtycoon.profile.ProfileService;
import dev.codingtycoon.task.Task;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import org.jboss.logging.Logger;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Domain service for player progression: awards XP into the ledger and derives totals from it.
 * A "day" is a UTC calendar day.
 */
@ApplicationScoped
public class ProgressService {

    /** XP awarded when a task is approved. */
    public static final int XP_PER_APPROVED_TASK = 100;

    private static final Logger LOG = Logger.getLogger(ProgressService.class);

    @Inject
    XpEventRepository xpEventRepository;

    @Inject
    ProfileService profileService;

    /**
     * Records the approval award for a task. Safe to call repeatedly: a task is only paid once.
     *
     * @param task the task that reached APPROVED
     */
    @Transactional
    public void awardForApproval(Task task) {
        if (xpEventRepository.exists(task.id, XpReason.TASK_APPROVED)) {
            LOG.warnf("XP for task %d already awarded, skipping", task.id);
            return;
        }
        XpEvent event = new XpEvent();
        event.playerProfileId = task.playerProfileId;
        event.taskId = task.id;
        event.amount = XP_PER_APPROVED_TASK;
        event.reason = XpReason.TASK_APPROVED;
        xpEventRepository.save(event);
        LOG.infof("Awarded %d XP to profile %d for task %d", event.amount, task.playerProfileId, task.id);
    }

    /**
     * Returns the authenticated player's XP totals and approval streak.
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
        long xpToday = events.stream()
                .filter(e -> e.createdAt.toLocalDate().equals(today))
                .mapToLong(e -> e.amount)
                .sum();
        List<LocalDate> approvalDays = events.stream()
                .filter(e -> e.reason == XpReason.TASK_APPROVED)
                .map(e -> e.createdAt.toLocalDate())
                .toList();
        Streak streak = StreakCalculator.calculate(approvalDays, today);
        return new ProgressResponse(totalXp, xpToday, streak.current(), streak.longest());
    }
}
