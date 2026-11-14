import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { encodePath, fetchWithAuth } from '../lib/api'
import type { CodebaseFile } from '../types/codebase'
import type { Submission } from '../types/submission'
import type { Task } from '../types/task'

/** One focus file being edited: `draft` is the player's version, `original` the codebase one. */
export interface DraftFile {
  path: string
  original: string
  draft: string
}

interface DraftsValue {
  files: DraftFile[]
  changedPaths: string[]
  isLoading: boolean
  error: string | null
  /** Loads the task's files once; later calls for the same task keep the drafts. */
  loadDrafts: (task: Task) => void
  setDraft: (path: string, content: string) => void
  resetFile: (path: string) => void
}

const DraftsContext = createContext<DraftsValue | null>(null)

/**
 * Holds the player's edits to the active task's focus files. It lives in GameShell, above the
 * panel, so drafts survive tab switches, closing the panel and a Profile visit, and the Editor and
 * VCS tabs share them. A refresh loses them (out of scope for Phase 4).
 */
export function DraftsProvider({ children }: { children: ReactNode }) {
  const { getAccessTokenSilently } = useAuth0()
  const [files, setFiles] = useState<DraftFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The task loaded or loading; a ref so two tabs asking at once start only one load.
  const taskId = useRef<number | null>(null)

  const loadDrafts = useCallback(
    (task: Task) => {
      if (taskId.current === task.id) return
      taskId.current = task.id
      setIsLoading(true)
      setError(null)
      setFiles([])
      loadFiles(task, getAccessTokenSilently)
        .then((loaded) => {
          if (taskId.current !== task.id) return
          setFiles(loaded)
          setIsLoading(false)
        })
        .catch(() => {
          if (taskId.current !== task.id) return
          taskId.current = null // lets the next call retry
          setError('Failed to load the task files')
          setIsLoading(false)
        })
    },
    [getAccessTokenSilently],
  )

  const setDraft = useCallback((path: string, content: string) => {
    setFiles((current) =>
      current.map((file) => (file.path === path ? { ...file, draft: content } : file)),
    )
  }, [])

  const resetFile = useCallback((path: string) => {
    setFiles((current) =>
      current.map((file) => (file.path === path ? { ...file, draft: file.original } : file)),
    )
  }, [])

  const value = useMemo(
    () => ({
      files,
      changedPaths: files.filter((file) => file.draft !== file.original).map((file) => file.path),
      isLoading,
      error,
      loadDrafts,
      setDraft,
      resetFile,
    }),
    [files, isLoading, error, loadDrafts, setDraft, resetFile],
  )

  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>
}

/** The shared drafts. Must be used inside DraftsProvider. */
// oxlint-disable-next-line react/only-export-components -- the spec keeps provider and hook together
export function useDrafts(): DraftsValue {
  const value = useContext(DraftsContext)
  if (!value) throw new Error('useDrafts must be used inside DraftsProvider')
  return value
}

/** Each file starts from its latest pushed version, so a reload or a review round keeps the work. */
async function loadFiles(
  task: Task,
  getToken: () => Promise<string | undefined>,
): Promise<DraftFile[]> {
  const token = await getToken()
  const [originals, latest] = await Promise.all([
    Promise.all(
      task.focusFiles.map((path) =>
        fetchWithAuth<CodebaseFile>(`/api/codebase/files/${encodePath(path)}`, token),
      ),
    ),
    fetchWithAuth<Submission | undefined>('/api/submissions/latest', token),
  ])
  const pushed = latest?.taskId === task.id ? latest.files : []
  return originals.map(({ path, content }) => ({
    path,
    original: content,
    draft: pushed.find((file) => file.path === path)?.content ?? content,
  }))
}
