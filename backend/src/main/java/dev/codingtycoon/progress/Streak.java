package dev.codingtycoon.progress;

/**
 * Consecutive active days.
 *
 * @param current the run that is still alive (ends today or yesterday), 0 if none
 * @param longest the longest run ever
 */
public record Streak(int current, int longest) {
}
