import { useNavigate, useOutlet } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { RoomHud } from '../game/RoomHud'
import { RoomScene } from '../game/RoomScene'
import { useSessionFlow } from '../hooks/useSessionFlow'

/**
 * Main game hub: the isometric room with clickable objects.
 * Panels (nested routes) render on top through the outlet; the room is inert while one is open.
 */
export default function GameRoomPage() {
  const { user, logout } = useAuth0()
  const navigate = useNavigate()
  const panel = useOutlet()
  useSessionFlow()

  return (
    <div className="h-screen overflow-hidden bg-bg-base text-text-primary">
      <div className="flex h-full flex-col" inert={panel !== null}>
        <RoomHud
          email={user?.email}
          profilePath="/room/profile"
          onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        />
        <main className="min-h-0 flex-1 p-4">
          <RoomScene onOpenTaskBoard={() => navigate('/room/task')} />
        </main>
      </div>
      {panel}
    </div>
  )
}
