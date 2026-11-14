import type { ReactNode } from 'react'
import { useTask } from '../hooks/useTask'
import { TextLink } from './TextLink'
import type { Task } from '../types/task'

/** A short message with optional links, padded like a panel tab's content. */
export function PanelMessage({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-start gap-4 p-6 text-text-primary">{children}</div>
}

interface TaskFilesGateProps {
  /** Verb for the messages: "edit" gives "This task has no files to edit." */
  action: string
  children: (task: Task) => ReactNode
}

/**
 * Loads today's task and renders `children` only once there are focus files to work on and the
 * task is started. Shared by the Editor and VCS tabs; refetches each time the tab is shown.
 */
export function TaskFilesGate({ action, children }: TaskFilesGateProps) {
  const { task, isLoading, error } = useTask()

  if (isLoading) return <PanelMessage>Loading today's task…</PanelMessage>
  if (error) return <p className="p-6 text-danger">{error}</p>
  if (!task || task.focusFiles.length === 0) {
    return (
      <PanelMessage>
        This task has no files to {action}.
        <TextLink to="/room/codebase">Explore the codebase</TextLink>
      </PanelMessage>
    )
  }
  if (task.status === 'ASSIGNED') {
    return (
      <PanelMessage>
        Start the task to {action} its files.
        <TextLink to="/room/task">Go to the task board</TextLink>
      </PanelMessage>
    )
  }
  return children(task)
}
