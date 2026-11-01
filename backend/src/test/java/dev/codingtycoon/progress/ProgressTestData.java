package dev.codingtycoon.progress;

import dev.codingtycoon.profile.JpaProfileRepository;
import dev.codingtycoon.profile.PlayerProfile;
import dev.codingtycoon.task.JpaTaskRepository;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskStatus;
import dev.codingtycoon.user.JpaUserRepository;
import dev.codingtycoon.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;

/** Shared fixtures for progress tests; each method commits so REST calls see the data. */
@ApplicationScoped
public class ProgressTestData {

    @Inject
    EntityManager em;

    @Inject
    JpaUserRepository userRepository;

    @Inject
    JpaProfileRepository profileRepository;

    @Inject
    JpaTaskRepository taskRepository;

    @Inject
    JpaXpEventRepository xpEventRepository;

    /** Deletes progress-related rows in FK order. */
    @Transactional
    public void clear() {
        xpEventRepository.deleteAll();
        em.createNativeQuery("DELETE FROM tasks").executeUpdate();
        em.createNativeQuery("DELETE FROM player_profile_topics").executeUpdate();
        profileRepository.deleteAll();
        userRepository.deleteAll();
    }

    /** Creates a user with a profile and returns the profile ID. */
    @Transactional
    public Long createProfile(String sub) {
        User user = createUser(sub);
        PlayerProfile profile = new PlayerProfile();
        profile.userId = user.id;
        profile.language = "Java";
        profile.framework = "Spring Boot";
        profile.seniority = "Junior";
        profileRepository.persist(profile);
        return profile.id;
    }

    /** Creates a user without a profile. */
    @Transactional
    public User createUser(String sub) {
        User user = new User();
        user.sub = sub;
        user.email = sub + "@example.com";
        userRepository.persist(user);
        return user;
    }

    @Transactional
    public Task createTask(Long profileId) {
        Task task = new Task();
        task.playerProfileId = profileId;
        task.title = "Fixture task";
        task.description = "Fixture";
        task.acceptanceCriteria = "Fixture";
        task.difficulty = "Easy";
        task.status = TaskStatus.SUBMITTED;
        taskRepository.persist(task);
        return task;
    }

    /** Inserts an approval event at a given UTC time, bypassing the service, to simulate past days. */
    @Transactional
    public void createEvent(Long profileId, Task task, LocalDateTime createdAt) {
        XpEvent event = new XpEvent();
        event.playerProfileId = profileId;
        event.taskId = task.id;
        event.amount = ProgressService.XP_PER_APPROVED_TASK;
        event.reason = XpReason.TASK_APPROVED;
        event.createdAt = createdAt;
        xpEventRepository.persist(event);
    }
}
