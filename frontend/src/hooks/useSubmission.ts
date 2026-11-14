import { useCallback, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { ApiError, fetchWithAuth } from '../lib/api'
import type { CodebaseFile } from '../types/codebase'
import type { Submission } from '../types/submission'

/**
 * The active task's latest push (`GET /api/submissions/latest`) and the push itself
 * (`POST /api/submissions`). The latest push reloads each time the VCS tab is shown.
 */
export function useSubmission(): {
  latest: Submission | null
  isLoading: boolean
  loadError: string | null
  pushError: string | null
  /** Resolves to true once stored; on failure keeps the server's reason in `pushError`. */
  push: (commitMessage: string, files: CodebaseFile[]) => Promise<boolean>
} {
  const { getAccessTokenSilently } = useAuth0()
  const [latest, setLatest] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pushError, setPushError] = useState<string | null>(null)

  useEffect(() => {
    getAccessTokenSilently()
      .then((token) => fetchWithAuth<Submission | undefined>('/api/submissions/latest', token))
      .then((result) => {
        setLatest(result ?? null)
        setLoadError(null)
      })
      .catch(() => setLoadError('Failed to load your last push'))
      .finally(() => setIsLoading(false))
  }, [getAccessTokenSilently])

  const push = useCallback(
    async (commitMessage: string, files: CodebaseFile[]): Promise<boolean> => {
      setPushError(null)
      try {
        const token = await getAccessTokenSilently()
        const pushed = await fetchWithAuth<Submission>('/api/submissions', token, {
          method: 'POST',
          body: JSON.stringify({ commitMessage, files }),
        })
        setLatest(pushed)
        return true
      } catch (err) {
        setPushError(
          (err instanceof ApiError && err.serverMessage) ||
            'Push failed. Check your connection and try again.',
        )
        return false
      }
    },
    [getAccessTokenSilently],
  )

  return { latest, isLoading, loadError, pushError, push }
}
