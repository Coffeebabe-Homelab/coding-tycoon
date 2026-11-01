import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { fetchWithAuth } from '../lib/api'
import type { CodebaseFile, CodebaseFiles } from '../types/codebase'

/** Encodes each segment but keeps the slashes the backend route expects. */
function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

/**
 * Loads the active task's codebase file list once and opens files on demand.
 * `noActiveTask` is true when the backend answers 404 for the file list.
 */
export function useCodebase(): {
  files: string[]
  focusFiles: string[]
  openFile: (path: string) => Promise<void>
  current: CodebaseFile | null
  isLoading: boolean
  error: string | null
  noActiveTask: boolean
} {
  const { getAccessTokenSilently } = useAuth0()
  const [codebase, setCodebase] = useState<CodebaseFiles | null>(null)
  const [current, setCurrent] = useState<CodebaseFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noActiveTask, setNoActiveTask] = useState(false)
  // Clicking quickly through files must not let a slow earlier response win.
  const latestPath = useRef<string | null>(null)

  useEffect(() => {
    getAccessTokenSilently()
      .then((token) => fetchWithAuth<CodebaseFiles>('/api/codebase/files', token))
      .then(setCodebase)
      .catch((err: Error) => {
        if (err.message.startsWith('API error 404')) setNoActiveTask(true)
        else setError('Failed to load the codebase')
      })
      .finally(() => setIsLoading(false))
  }, [getAccessTokenSilently])

  const openFile = useCallback(
    async (path: string): Promise<void> => {
      latestPath.current = path
      setError(null)
      try {
        const token = await getAccessTokenSilently()
        const file = await fetchWithAuth<CodebaseFile>(
          `/api/codebase/files/${encodePath(path)}`,
          token,
        )
        if (latestPath.current === path) setCurrent(file)
      } catch {
        if (latestPath.current === path) setError(`Failed to open ${path}`)
      }
    },
    [getAccessTokenSilently],
  )

  return {
    files: codebase?.files ?? [],
    focusFiles: codebase?.focusFiles ?? [],
    openFile,
    current,
    isLoading,
    error,
    noActiveTask,
  }
}
