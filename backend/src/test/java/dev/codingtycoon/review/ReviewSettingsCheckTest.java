package dev.codingtycoon.review;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReviewSettingsCheckTest {

    static ReviewSettings settings(Duration target, Duration timeout, Duration stuckAfter, int maxFailures) {
        return new ReviewSettings() {
            public Duration targetDuration() { return target; }
            public Duration timeout() { return timeout; }
            public Duration stuckAfter() { return stuckAfter; }
            public int maxFailures() { return maxFailures; }
            public Duration retryBackoff() { return Duration.ofSeconds(30); }
            public String pollInterval() { return "5s"; }
        };
    }

    @Test
    void theDefaultsAreValid() {
        assertDoesNotThrow(() -> ReviewSettingsCheck.validate(
                settings(Duration.ofSeconds(30), Duration.ofMinutes(5), Duration.ofMinutes(10), 3)));
    }

    @Test
    void aTimeoutShorterThanTheTargetFailsStartup() {
        var e = assertThrows(IllegalStateException.class, () -> ReviewSettingsCheck.validate(
                settings(Duration.ofSeconds(30), Duration.ofSeconds(20), Duration.ofMinutes(10), 3)));
        assertTrue(e.getMessage().contains("CODINGTYCOON_REVIEW_TIMEOUT"));
    }

    @Test
    void stuckAfterMustBeLongerThanTheTimeout() {
        // Otherwise a review still running would be put back and reviewed twice.
        var e = assertThrows(IllegalStateException.class, () -> ReviewSettingsCheck.validate(
                settings(Duration.ofSeconds(30), Duration.ofMinutes(5), Duration.ofMinutes(5), 3)));
        assertTrue(e.getMessage().contains("CODINGTYCOON_REVIEW_STUCK_AFTER"));
    }

    @Test
    void atLeastOneFailureIsAllowed() {
        assertThrows(IllegalStateException.class, () -> ReviewSettingsCheck.validate(
                settings(Duration.ofSeconds(30), Duration.ofMinutes(5), Duration.ofMinutes(10), 0)));
    }
}
