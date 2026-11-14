package dev.codingtycoon.submission;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

/**
 * A stored push, as returned by the submission endpoints.
 *
 * @param id            submission ID
 * @param taskId        the task it was pushed for
 * @param attemptNumber 1 for the first push of a task, then 2, 3…
 * @param commitMessage the trimmed commit message
 * @param submittedAt   when the push was stored, in UTC
 * @param files         the pushed files, sorted by path
 */
public record SubmissionResponse(Long id, Long taskId, int attemptNumber, String commitMessage,
                                 Instant submittedAt, List<FileResponse> files) {

    /**
     * One pushed file.
     *
     * @param path    codebase-relative path
     * @param content the file's full content
     */
    public record FileResponse(String path, String content) {
    }

    /**
     * Maps a submission entity to its response.
     *
     * @param submission the stored submission
     * @return the response body
     */
    public static SubmissionResponse from(Submission submission) {
        List<FileResponse> files = submission.files.stream()
                .map(file -> new FileResponse(file.path, file.content))
                .toList();
        return new SubmissionResponse(submission.id, submission.taskId, submission.attemptNumber,
                submission.commitMessage, submission.submittedAt.toInstant(ZoneOffset.UTC), files);
    }
}
