package dev.codingtycoon.progress;

/**
 * JSON response for GET /api/progress.
 *
 * @param level the player's level; a mock value until the level model exists
 * @param totalXp all XP ever earned
 * @param xpToday XP earned during the current UTC day
 * @param currentStreak consecutive days with an approved task, ending today or yesterday
 * @param longestStreak the longest such run ever
 * @param approvedTodayTaskTitle title of the latest task approved today, or null if none
 */
public record ProgressResponse(String level, long totalXp, long xpToday, int currentStreak, int longestStreak,
                               String approvedTodayTaskTitle) {
}
