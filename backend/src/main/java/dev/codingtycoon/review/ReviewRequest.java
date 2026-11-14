package dev.codingtycoon.review;

import java.util.List;

/**
 * Everything the reviewer needs about one push, in our own types only.
 *
 * @param attemptNumber   the push's attempt, from 1
 * @param taskTitle       the ticket title
 * @param taskDescription the ticket description
 * @param criteria        the ticket's acceptance criteria, in order
 * @param originals       the focus files as the codebase has them
 * @param pushed          the files the player pushed
 * @param guidelines      the review guidelines the reviewer must apply
 */
public record ReviewRequest(
        int attemptNumber,
        String taskTitle,
        String taskDescription,
        List<String> criteria,
        List<ReviewFile> originals,
        List<ReviewFile> pushed,
        String guidelines
) {}
