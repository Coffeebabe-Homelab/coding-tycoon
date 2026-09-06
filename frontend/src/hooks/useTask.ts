import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { fetchWithAuth } from '../lib/api'
import type { Task } from '../types/task'

/**
 * Fetches today's task from GET /api/tasks/today and exposes a mutation to
 * transition it to IN_PROGRESS.
 *
 * @returns {{
 *   task: Task | null,
 *   isLoading: boolean,
 *   error: string | null,
 *   startTask: () => Promise<void>
 * }}
 */
export function useTask(): {
  task: Task | null
  isLoading: boolean
  error: string | null
  startTask: () => Promise<void>
} {
  const { getAccessTokenSilently } = useAuth0()
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    getAccessTokenSilently()
      .then((token) => fetchWithAuth<Task>('/api/tasks/today', token))
      .then(setTask)
      .catch(() => setError("Failed to load today's task"))
      .finally(() => setIsLoading(false))
    // getAccessTokenSilently is stable — no re-render risk
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Transitions the current task to IN_PROGRESS via PATCH /api/tasks/{id}/status.
   * Updates local task state on success so the UI reflects the new status
   * without a full refetch.
   */
  const startTask = async (): Promise<void> => {
    if (!task) return
    const token = await getAccessTokenSilently()
    const updated = await fetchWithAuth<Task>(`/api/tasks/${task.id}/status`, token, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    })
    setTask(updated)
  }

  return { task, isLoading, error, startTask }
}
