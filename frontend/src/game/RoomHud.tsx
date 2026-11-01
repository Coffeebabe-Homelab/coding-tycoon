import { Link } from 'react-router-dom'

interface RoomHudProps {
  email?: string
  profilePath: string
  onLogout: () => void
}

const HUD_LINK_CLASS =
  'text-sm text-accent transition-colors hover:text-accent-hover focus:text-accent-hover focus:underline focus:outline-none'

/** Slim strip above the room: who is playing, profile link and log out. */
export function RoomHud({ email, profilePath, onLogout }: RoomHudProps) {
  return (
    <header className="flex items-center justify-between gap-6 border-b border-border bg-bg-surface px-6 py-3">
      <span className="font-semibold text-text-primary">Coding Tycoon</span>
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
