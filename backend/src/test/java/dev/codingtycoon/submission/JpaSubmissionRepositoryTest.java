package dev.codingtycoon.submission;

import dev.codingtycoon.progress.ProgressTestData;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskStatus;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Checks V10 and the entity mapping against PostgreSQL. */
@QuarkusTest
class JpaSubmissionRepositoryTest {

    @Inject
    JpaSubmissionRepository repository;

    @Inject
    ProgressTestData testData;

    @Inject
    EntityManager em;

    private Task task;

    @BeforeEach
    void setUp() {
        testData.clear();
        Long profileId = testData.createProfile("auth0|submission-repo");
        task = testData.createTask(profileId, "Push me", TaskStatus.IN_PROGRESS);
    }

    @Test
    @Transactional
    void savesASubmissionWithItsFilesInPathOrder() {
        repository.save(submission(1, "b/B.java", "a/A.java"));
        em.clear(); // read back from the database, where @OrderBy applies

        Submission latest = repository.findLatestForTask(task.id).orElseThrow();

        assertEquals("feat: push 1", latest.commitMessage);
        assertEquals(List.of("a/A.java", "b/B.java"), latest.files.stream().map(file -> file.path).toList());
    }

    @Test
    @Transactional
    void latestIsTheHighestAttemptAndCountIncludesEveryPush() {
        repository.save(submission(1, "a/A.java"));
        repository.save(submission(2, "a/A.java"));

        assertEquals(2, repository.findLatestForTask(task.id).orElseThrow().attemptNumber);
        assertEquals(2, repository.countForTask(task.id));
    }

    @Test
    @Transactional
    void taskWithoutPushesHasNoLatest() {
        assertTrue(repository.findLatestForTask(task.id).isEmpty());
        assertEquals(0, repository.countForTask(task.id));
    }

    private Submission submission(int attempt, String... paths) {
        Submission submission = new Submission();
        submission.taskId = task.id;
        submission.playerProfileId = task.playerProfileId;
        submission.attemptNumber = attempt;
        submission.commitMessage = "feat: push " + attempt;
        for (String path : paths) {
            submission.files.add(SubmissionFile.of(path, "class X {}"));
        }
        return submission;
    }
}
