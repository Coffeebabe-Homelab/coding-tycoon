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
  status: TaskStatus
  createdAt: string
}
