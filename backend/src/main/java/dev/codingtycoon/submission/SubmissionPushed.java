package dev.codingtycoon.submission;

/**
 * Fired synchronously inside the push's transaction, so what observers store commits or rolls back
 * with the push. Lets the review domain react without the submission domain depending on it.
 *
 * @param submissionId the stored push
 */
public record SubmissionPushed(Long submissionId) {}
