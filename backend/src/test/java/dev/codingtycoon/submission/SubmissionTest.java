package dev.codingtycoon.submission;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SubmissionTest {

    @Test
    void displayHashIsTheShortMd5OfTaskProfileAndAttempt() {
        assertEquals("e234bb7", submission(7L, 2L, 1).displayHash());
    }

    @Test
    void displayHashChangesWithTheAttempt() {
        assertEquals("aec841a", submission(7L, 2L, 2).displayHash());
    }

    private static Submission submission(Long taskId, Long profileId, int attempt) {
        Submission submission = new Submission();
        submission.taskId = taskId;
        submission.playerProfileId = profileId;
        submission.attemptNumber = attempt;
        return submission;
    }
}
