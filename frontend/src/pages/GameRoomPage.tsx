import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { RoomHud } from '../game/RoomHud'
import { RoomScene } from '../game/RoomScene'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

/**
 * Main game hub: the isometric room with clickable objects.
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
    <div className="flex h-screen flex-col bg-bg-base text-text-primary">
      <RoomHud
        email={user?.email}
        profilePath="/profile"
        onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      />
      <main className="min-h-0 flex-1 p-4">
        <RoomScene onOpenTaskBoard={() => navigate('/room/task')} />
      </main>
    </div>
  )
}
