/** The player's progression, from GET /api/progress. Days are UTC calendar days. */
export interface Progress {
  /** A mock value from the API until the level model exists. */
  level: string
  totalXp: number
  xpToday: number
  /** Consecutive days with an approved task, ending today or yesterday. */
  currentStreak: number
  longestStreak: number
  /** Latest task approved today, or null if none. */
  approvedTodayTaskTitle: string | null
}
