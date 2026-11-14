package dev.codingtycoon.review;

import io.smallrye.config.ConfigMapping;

import java.time.Duration;

/**
 * Review timing and retry settings, all tunable through env vars without a rebuild.
 * {@link ReviewSettingsCheck} rejects inconsistent values at startup.
 */
@ConfigMapping(prefix = "codingtycoon.review")
public interface ReviewSettings {

    /** How long a review should take. Not a limit: past it the UI says "taking longer than usual". */
    Duration targetDuration();

    /** Hard limit on one reviewer call; past it the call counts as a failure. */
    Duration timeout();

    /** Failures on our side before a review becomes FAILED. They never use up an attempt. */
    int maxFailures();

    /** Wait before the first retry; doubled after each further failure. */
    Duration retryBackoff();

    /** How long a review may stay RUNNING before it is treated as abandoned and put back. */
    Duration stuckAfter();

    /** How often the worker looks for due reviews, as a scheduler interval ({@code off} disables it). */
    String pollInterval();
}
