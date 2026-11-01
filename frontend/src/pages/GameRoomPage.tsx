import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

/**
 * Main game hub page.
 * On mount, checks whether the player has a profile. If the API returns 404,
 * the player is redirected to /onboarding to complete setup.
 */
export default function GameRoomPage() {
  const { user, logout, getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    getAccessTokenSilently()
      .then(async (token) => {
        const res = await fetch(`${BASE_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (res.status === 404) {
          navigate('/onboarding', { replace: true })
        }
        // 200 or other status codes: stay on the room page
      })
      .catch(() => {
        // Network failure — stay on the room page and let the user retry
      })
  }, [getAccessTokenSilently, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-base text-text-primary">
      <h1 className="text-2xl font-semibold">Welcome to the Game Room</h1>
      <p className="text-text-muted">Logged in as {user?.email}</p>

      <Link
        to="/room/task"
        className="rounded-lg bg-accent px-6 py-3 text-base font-semibold text-text-primary transition-colors hover:bg-accent-hover focus:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
      >
        View today's task
      </Link>

      <Link
        to="/room/codebase"
        className="text-sm text-accent transition-colors hover:text-accent-hover focus:text-accent-hover focus:outline-none focus:underline"
      >
        Explore codebase
      </Link>

      <Link
        to="/profile"
        className="text-sm text-accent transition-colors hover:text-accent-hover focus:text-accent-hover focus:outline-none focus:underline"
      >
        View Profile
      </Link>

      <button
        type="button"
        className="rounded-lg bg-accent px-4 py-2 text-sm text-text-primary transition-colors hover:bg-accent-hover focus:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      >
        Log out
      </button>
    </div>
  )
}
