import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { ApiError, fetchWithAuth } from '../lib/api'
import type { PlayerProfile } from '../types/profile'
import type { Task } from '../types/task'

const TASK_BOARD_OPENED_KEY = 'codingTycoon.taskBoardAutoOpened'

// sessionStorage can throw (privacy mode, blocked storage); the flow must still work without it.
function wasTaskBoardAutoOpened(): boolean {
  try {
    return sessionStorage.getItem(TASK_BOARD_OPENED_KEY) === 'true'
  } catch {
    return false
  }
}

function markTaskBoardAutoOpened(): void {
  try {
    sessionStorage.setItem(TASK_BOARD_OPENED_KEY, 'true')
  } catch {
    // Without storage the board may reopen on refresh; harmless.
  }
}

/**
 * Guides the player when they enter the room:
 * no profile → onboarding; today's task still ASSIGNED → open the Task Board once per session.
 * Deep links to a panel (e.g. /room/profile) are respected and never redirected.
 */
export function useSessionFlow(): void {
  const { getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const enteredAtRoom = useRef(pathname === '/room')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const token = await getAccessTokenSilently()
      try {
        await fetchWithAuth<PlayerProfile>('/api/profile', token)
      } catch (error) {
        if (!cancelled && error instanceof ApiError && error.status === 404) {
          navigate('/onboarding', { replace: true })
        }
        return
      }
      if (!enteredAtRoom.current || wasTaskBoardAutoOpened()) return

      const task = await fetchWithAuth<Task>('/api/tasks/today', token)
      if (!cancelled && task.status === 'ASSIGNED') {
        markTaskBoardAutoOpened()
        navigate('/room/task')
      }
    }

    // Network failure: stay in the room and let the player use the hotspots.
    run().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [getAccessTokenSilently, navigate])
}
