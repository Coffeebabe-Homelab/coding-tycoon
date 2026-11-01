import { Link } from 'react-router-dom'
import type { Progress } from '../types/progress'

interface RoomHudProps {
  email?: string
  profilePath: string
  endOfDayPath: string
  /** Null while loading or if the request failed: the stats are then simply hidden. */
  progress: Progress | null
  onLogout: () => void
}

const HUD_LINK_CLASS =
  'text-sm text-accent transition-colors hover:text-accent-hover focus:text-accent-hover focus:underline focus:outline-none'

/** Slim strip above the room: XP, streak, who is playing, profile link and log out. */
export function RoomHud({ email, profilePath, endOfDayPath, progress, onLogout }: RoomHudProps) {
  return (
    <header className="flex items-center justify-between gap-6 border-b border-border bg-bg-surface px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-text-primary">Coding Tycoon</span>
        {progress && (
          <dl className="flex items-center gap-4 text-sm">
            <div className="flex gap-1">
              <dt className="text-text-muted">XP</dt>
              <dd className="font-semibold text-text-primary">{progress.totalXp}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-text-muted">Streak</dt>
              <dd className="font-semibold text-text-primary">{progress.currentStreak} d</dd>
            </div>
          </dl>
        )}
        {progress?.approvedTodayTaskTitle && (
          <Link to={endOfDayPath} className={HUD_LINK_CLASS}>
            Task approved: wrap up the day
          </Link>
        )}
      </div>
      <nav aria-label="Player" className="flex items-center gap-6">
        <span className="text-sm text-text-muted">{email}</span>
        <Link to={profilePath} className={HUD_LINK_CLASS}>
          Profile
        </Link>
        <button type="button" onClick={onLogout} className={HUD_LINK_CLASS}>
          Log out
        </button>
      </nav>
    </header>
  )
}
