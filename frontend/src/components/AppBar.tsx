import { Link } from 'react-router-dom'
import type { Progress } from '../types/progress'
import { Icon } from './Icon'

interface AppBarProps {
  email?: string
  /** The panel or page shown after "Room" in the breadcrumb. */
  panelLabel?: string
  /** Null while loading or if the request failed: the stats are then simply hidden. */
  progress: Progress | null
  onLogout: () => void
}

const LINK_CLASS = 'text-sm text-accent transition-colors hover:text-accent-hover'

/** The bar on every game screen (Figma 9:316). The player links become the avatar menu. */
export function AppBar({ email, panelLabel, progress, onLogout }: AppBarProps) {
  return (
    <header className="flex h-[61px] shrink-0 items-center justify-between gap-6 border-b border-border bg-bg-surface px-6">
      <div className="flex items-center gap-6">
        <span className="font-display text-xl font-medium uppercase text-accent">
          Coding Tycoon
        </span>
        <nav aria-label="Breadcrumb" className="text-body-m text-text-muted">
          <Link to="/room" className="transition-colors hover:text-text-primary">
            Room
          </Link>
          {panelLabel && ` / ${panelLabel}`}
        </nav>
        {progress?.approvedTodayTaskTitle && (
          <Link to="/room/end-of-day" className={LINK_CLASS}>
            Task approved: wrap up the day
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {progress && (
          <>
            <span className="flex items-center gap-1 rounded-full bg-bg-elevated px-3 py-1 text-label-s text-text-primary">
              <Icon name="flame" />
              {progress.currentStreak}-day streak
            </span>
            <span className="rounded-full bg-accent-subtle px-3 py-1 font-display text-display-m text-accent-on-subtle">
              LV {progress.level} · {progress.totalXp.toLocaleString('en-US')} XP
            </span>
          </>
        )}
        <nav aria-label="Player" className="flex items-center gap-4">
          <span className="text-sm text-text-muted">{email}</span>
          <Link to="/profile" className={LINK_CLASS}>
            Profile
          </Link>
          <button type="button" onClick={onLogout} className={LINK_CLASS}>
            Log out
          </button>
        </nav>
      </div>
    </header>
  )
}
