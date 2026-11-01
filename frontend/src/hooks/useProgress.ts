import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { fetchWithAuth } from '../lib/api'
import type { Progress } from '../types/progress'

/**
 * Fetches the player's XP and streak from GET /api/progress.
 *
 * @param refreshKey refetches whenever this value changes (e.g. when a panel closes)
 */
export function useProgress(refreshKey?: unknown): {
  progress: Progress | null
  isLoading: boolean
  error: string | null
} {
  const { getAccessTokenSilently } = useAuth0()
  const [progress, setProgress] = useState<Progress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Refetches keep showing the previous values until the new ones arrive, so no loading reset here.
    let cancelled = false
    getAccessTokenSilently()
      .then((token) => fetchWithAuth<Progress>('/api/progress', token))
      .then((result) => {
        if (cancelled) return
        setProgress(result)
        setError(null)
      })
      .catch(() => !cancelled && setError('Failed to load progress'))
      .finally(() => !cancelled && setIsLoading(false))
    return () => {
      cancelled = true
    }
  }, [getAccessTokenSilently, refreshKey])

  return { progress, isLoading, error }
}
