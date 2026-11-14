import type { CodebaseFile } from './codebase'

/** A push from the VCS panel, as returned by /api/submissions. */
export interface Submission {
  id: number
  taskId: number
  attemptNumber: number
  commitMessage: string
  submittedAt: string
  files: CodebaseFile[]
}
