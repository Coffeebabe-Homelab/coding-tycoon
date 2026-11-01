/** Response of GET /api/codebase/files: the codebase attached to the active task. */
export interface CodebaseFiles {
  codebase: string
  /** Paths the active task is about, opened first in the explorer. */
  focusFiles: string[]
  /** Every file path in the codebase, flat and sorted. */
  files: string[]
}

/** Response of GET /api/codebase/files/{path}. */
export interface CodebaseFile {
  path: string
  content: string
}
