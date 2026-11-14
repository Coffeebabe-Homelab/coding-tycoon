package dev.codingtycoon.review;

import dev.codingtycoon.progress.ProgressTestData;
import dev.codingtycoon.submission.JpaSubmissionRepository;
import dev.codingtycoon.submission.Submission;
import dev.codingtycoon.submission.SubmissionFile;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

/** Pushes and reviews for review tests, inserted directly so each test sets up only what it needs. */
@ApplicationScoped
public class ReviewTestData {

    @Inject
    ProgressTestData progressTestData;

    @Inject
    JpaSubmissionRepository submissionRepository;

    @Inject
    JpaReviewRepository reviewRepository;

    /** Deletes players, tasks and everything that cascades from them: pushes and reviews. */
    public void clear() {
        progressTestData.clear();
    }

    /** A player with a submitted task and one push of {@code path}. */
    public Submission createPush(String sub, String path, String content) {
        Long profileId = progressTestData.createProfile(sub);
        Task task = progressTestData.createTask(profileId, "Review fixture", TaskStatus.SUBMITTED);
        return createPush(task, 1, path, content);
    }

    @Transactional
    public Submission createPush(Task task, int attempt, String path, String content) {
        Submission submission = new Submission();
        submission.taskId = task.id;
        submission.playerProfileId = task.playerProfileId;
        submission.attemptNumber = attempt;
        submission.commitMessage = "feat: fixture";
        submission.files.add(SubmissionFile.of(path, content));
        submissionRepository.persist(submission);
        return submission;
    }

    @Transactional
    public Review createReview(Long submissionId) {
        Review review = new Review();
        review.submissionId = submissionId;
        reviewRepository.persist(review);
        return review;
    }

    @Transactional
    public Review find(Long reviewId) {
        return reviewRepository.findReviewById(reviewId).orElseThrow();
    }
}
