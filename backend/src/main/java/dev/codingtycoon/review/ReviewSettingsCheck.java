package dev.codingtycoon.review;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;

/** Fails startup on review settings that can't work together, with the env var to change. */
@ApplicationScoped
public class ReviewSettingsCheck {

    void onStart(@Observes StartupEvent event, ReviewSettings settings) {
        validate(settings);
    }

    static void validate(ReviewSettings settings) {
        if (settings.timeout().compareTo(settings.targetDuration()) < 0) {
            throw new IllegalStateException("CODINGTYCOON_REVIEW_TIMEOUT (" + settings.timeout()
                    + ") must not be shorter than CODINGTYCOON_REVIEW_TARGET_DURATION (" + settings.targetDuration() + ")");
        }
        // A review still inside its call must never look abandoned, or it would be reviewed twice.
        if (settings.stuckAfter().compareTo(settings.timeout()) <= 0) {
            throw new IllegalStateException("CODINGTYCOON_REVIEW_STUCK_AFTER (" + settings.stuckAfter()
                    + ") must be longer than CODINGTYCOON_REVIEW_TIMEOUT (" + settings.timeout() + ")");
        }
        if (settings.maxFailures() < 1) {
            throw new IllegalStateException("CODINGTYCOON_REVIEW_MAX_FAILURES must be at least 1");
        }
    }
}
