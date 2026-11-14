package dev.codingtycoon.submission;

import dev.codingtycoon.codebase.CodebaseRepository;
import dev.codingtycoon.exception.UnprocessableException;
import dev.codingtycoon.submission.CreateSubmissionRequest.FileContent;
import dev.codingtycoon.task.Task;
import dev.codingtycoon.task.TaskService;
import dev.codingtycoon.task.TaskStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Domain service for pushes from the VCS panel. A push is the only way a task reaches SUBMITTED.
 * The task's focus files are the allow-list: nothing else can be pushed.
 */
@ApplicationScoped
public class SubmissionService {

    /** Generous for one source file; stops a pasted blob from filling the database. */
    static final int MAX_FILE_BYTES = 64 * 1024;

    @Inject
    TaskService taskService;

    @Inject
    CodebaseRepository codebaseRepository;

    @Inject
    SubmissionRepository submissionRepository;

    @Inject
    Event<SubmissionPushed> pushed;

    /**
     * Stores a push for the player's active task, moves the task to SUBMITTED and announces it
     * with {@link SubmissionPushed}, which queues its review.
     *
     * @param sub     the Auth0 subject claim identifying the player
     * @param request the commit message and changed files
     * @return the saved submission, numbered as the task's next attempt
     * @throws UnprocessableException if the task can't be pushed or the request is invalid
     * @throws jakarta.ws.rs.NotFoundException if no user or profile is found for the given sub
     */
    @Transactional
    public Submission push(String sub, CreateSubmissionRequest request) {
        if (request == null) {
            throw new UnprocessableException("Request body is required");
        }
        Task task = requirePushableTask(sub);
        String commitMessage = requireCommitMessage(request.commitMessage());
        List<SubmissionFile> files = requireChangedFiles(task, request.files());

        Submission submission = new Submission();
        submission.taskId = task.id;
        submission.playerProfileId = task.playerProfileId;
        submission.attemptNumber = (int) submissionRepository.countForTask(task.id) + 1;
        submission.commitMessage = commitMessage;
        submission.files.addAll(files);
        submissionRepository.save(submission);

        taskService.submit(task.id);
        pushed.fire(new SubmissionPushed(submission.id));
        return submission;
    }

    /**
     * Returns the latest push for the player's active task, so the VCS panel can show it after a reload.
     *
     * @param sub the Auth0 subject claim identifying the player
     * @return the latest submission, or empty if there is no active task or no push yet
     */
    @Transactional
    public Optional<Submission> findLatest(String sub) {
        return taskService.findActiveTask(sub)
                .flatMap(task -> submissionRepository.findLatestForTask(task.id));
    }

    /**
     * Returns the latest push for the player's newest task, active or just approved, so its review
     * stays visible after the approval.
     *
     * @param sub the Auth0 subject claim identifying the player
     * @return the latest submission, or empty if the newest task has no push yet
     */
    @Transactional
    public Optional<Submission> findLatestOfNewestTask(String sub) {
        return taskService.findNewestTask(sub)
                .flatMap(task -> submissionRepository.findLatestForTask(task.id));
    }

    private Task requirePushableTask(String sub) {
        Task task = taskService.findActiveTask(sub)
                .orElseThrow(() -> new UnprocessableException("No active task to push to"));
        if (task.status != TaskStatus.IN_PROGRESS && task.status != TaskStatus.CHANGES_REQUESTED) {
            throw new UnprocessableException("Task is " + task.status + ": start it before pushing");
        }
        return task;
    }

    private String requireCommitMessage(String message) {
        String trimmed = message == null ? "" : message.strip();
        if (trimmed.isEmpty()) {
            throw new UnprocessableException("Commit message is required");
        }
        if (trimmed.length() > Submission.MAX_COMMIT_MESSAGE_LENGTH) {
            throw new UnprocessableException(
                    "Commit message is over " + Submission.MAX_COMMIT_MESSAGE_LENGTH + " characters");
        }
        return trimmed;
    }

    private List<SubmissionFile> requireChangedFiles(Task task, List<FileContent> files) {
        if (files == null || files.isEmpty()) {
            throw new UnprocessableException("Push at least one changed file");
        }
        List<String> focusFiles = task.focusFileList();
        Set<String> seen = new HashSet<>();
        for (FileContent file : files) {
            if (!focusFiles.contains(file.path())) {
                throw new UnprocessableException(file.path() + " is not a file of this task");
            }
            if (!seen.add(file.path())) {
                throw new UnprocessableException(file.path() + " is pushed more than once");
            }
            requireChangedContent(task, file);
        }
        return files.stream()
                .map(file -> SubmissionFile.of(file.path(), file.content()))
                .sorted(Comparator.comparing(file -> file.path))
                .toList();
    }

    private void requireChangedContent(Task task, FileContent file) {
        if (file.content() == null) {
            throw new UnprocessableException(file.path() + " has no content");
        }
        if (file.content().getBytes(StandardCharsets.UTF_8).length > MAX_FILE_BYTES) {
            throw new UnprocessableException(file.path() + " is over 64 KB");
        }
        String original = codebaseRepository.readFile(task.codebaseKey, file.path())
                .orElseThrow(() -> new UnprocessableException(file.path() + " is not a file of this task"));
        if (original.equals(file.content())) {
            throw new UnprocessableException(file.path() + " is unchanged");
        }
    }
}
