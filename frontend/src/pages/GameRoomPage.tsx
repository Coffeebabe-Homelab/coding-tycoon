import { useNavigate, useOutlet } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { RoomHud } from '../game/RoomHud'
import { RoomScene } from '../game/RoomScene'
import { useProgress } from '../hooks/useProgress'
import { useSessionFlow } from '../hooks/useSessionFlow'

/**
 * Main game hub: the isometric room with clickable objects.
 * Panels (nested routes) render on top through the outlet; the room is inert while one is open.
 */
export default function GameRoomPage() {
  const { user, logout } = useAuth0()
  const navigate = useNavigate()
  const panel = useOutlet()
  const isPanelOpen = panel !== null
  // Refetch when a panel opens or closes so the HUD matches what the panel just showed.
  const { progress } = useProgress(isPanelOpen)
  useSessionFlow()

  return (
    <div className="h-screen overflow-hidden bg-bg-base text-text-primary">
      <div className="flex h-full flex-col" inert={isPanelOpen}>
        <RoomHud
          email={user?.email}
          profilePath="/room/profile"
          endOfDayPath="/room/end-of-day"
          progress={progress}
          onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        />
        <main className="min-h-0 flex-1 p-4">
          <RoomScene
            onOpenTaskBoard={() => navigate('/room/task')}
            onOpenEndOfDay={() => navigate('/room/end-of-day')}
          />
        </main>
      </div>
      {panel}
    </div>
  )
}
