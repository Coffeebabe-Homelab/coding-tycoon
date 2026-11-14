/** Possible states of a task in the player's workday. */
export type TaskStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED'

/** A task (ticket) assigned to the player for today's in-game workday. */
export interface Task {
  id: number
  title: string
  description: string
  acceptanceCriteria: string
  difficulty: string
  tags: string[]
  /** Synthetic codebase the task belongs to, browsable at /room/codebase. */
  codebaseKey: string
  /** Codebase-relative paths the task is about. */
  focusFiles: string[]
  status: TaskStatus
  createdAt: string
}

/** Statuses in which the player can change and push the task's files. */
export const EDITABLE_STATUSES: TaskStatus[] = ['IN_PROGRESS', 'CHANGES_REQUESTED']
