package dev.codingtycoon.progress;

/**
 * JSON response for GET /api/progress.
 *
 * @param totalXp all XP ever earned
 * @param xpToday XP earned during the current UTC day
 */
public record ProgressResponse(long totalXp, long xpToday) {
}
