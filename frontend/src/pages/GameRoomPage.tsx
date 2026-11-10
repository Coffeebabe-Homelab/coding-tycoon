import { Outlet, useMatch, useNavigate } from 'react-router-dom'
import { RoomScene } from '../game/RoomScene'

/**
 * Main game hub: the isometric room with clickable objects.
 * Panels (nested routes) open on top; the room is inert while one is open.
 */
export default function GameRoomPage() {
  const navigate = useNavigate()
  const isPanelOpen = useMatch('/room') === null

  return (
    <>
      <main className="min-h-0 flex-1 p-4" inert={isPanelOpen}>
        <RoomScene
          onOpenTaskBoard={() => navigate('/room/task')}
          onOpenEndOfDay={() => navigate('/room/end-of-day')}
          onOpenCodebase={() => navigate('/room/codebase')}
        />
      </main>
      <Outlet />
    </>
  )
}
