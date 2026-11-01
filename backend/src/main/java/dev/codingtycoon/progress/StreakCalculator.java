package dev.codingtycoon.progress;

import java.time.LocalDate;
import java.util.Collection;
import java.util.SortedSet;
import java.util.TreeSet;

/** Pure streak logic over active days; {@code today} is passed in so results are deterministic. */
public final class StreakCalculator {

    private StreakCalculator() {
    }

    /**
     * Computes the current and longest runs of consecutive active days.
     * The current run survives until today's work is done, so a run ending yesterday still counts.
     *
     * @param activeDays days with activity; duplicates and order don't matter
     * @param today      the current day
     * @return the streak
     */
    public static Streak calculate(Collection<LocalDate> activeDays, LocalDate today) {
        SortedSet<LocalDate> days = new TreeSet<>(activeDays);
        int run = 0;
        int longest = 0;
        LocalDate previous = null;
        for (LocalDate day : days) {
            run = day.minusDays(1).equals(previous) ? run + 1 : 1;
            longest = Math.max(longest, run);
            previous = day;
        }
        boolean alive = previous != null && !previous.isBefore(today.minusDays(1));
        return new Streak(alive ? run : 0, longest);
    }
}
