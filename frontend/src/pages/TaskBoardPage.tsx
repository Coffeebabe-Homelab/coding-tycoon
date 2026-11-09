import { useState } from 'react'
import { useTask } from '../hooks/useTask'
import { TextLink } from '../components/TextLink'
import type { Task } from '../types/task'
import { Button } from '../components/Button'
import { Difficulty } from '../components/Difficulty'
import { StatusBadge } from '../components/StatusBadge'

interface TaskDetailProps {
  task: Task
  onStartTask: () => Promise<void>
}

/** Renders the full task card with metadata, description, criteria, and action button. */
function TaskDetail({ task, onStartTask }: TaskDetailProps) {
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = async () => {
    setIsStarting(true)
    try {
      await onStartTask()
    } finally {
      setIsStarting(false)
    }
  }

  const criteriaLines = task.acceptanceCriteria
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return (
    <article>
      {/* Metadata row above the title, as in Figma 14:182 */}
      <div className="mb-4 flex items-center gap-2">
        <Difficulty level={task.difficulty} />
        <StatusBadge status={task.status} />
      </div>
      <h3 className="mb-4 text-2xl font-semibold text-text-primary">{task.title}</h3>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent-subtle px-2 py-0.5 text-xs text-accent-on-subtle"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="mb-6 leading-relaxed text-text-primary">{task.description}</p>

      {/* Codebase context */}
      <section aria-labelledby="focus-files-heading" className="mb-6">
        <h4
          id="focus-files-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted"
        >
          Codebase
        </h4>
        {task.focusFiles.length > 0 && (
          <ul className="mb-3 flex flex-col gap-1">
            {task.focusFiles.map((path) => (
              <li key={path}>
                <TextLink
                  to={{
                    pathname: '/room/codebase',
                    search: `?${new URLSearchParams({ file: path })}`,
                  }}
                  className="font-mono"
                >
                  {path}
                </TextLink>
              </li>
            ))}
          </ul>
        )}
        <TextLink to="/room/codebase">Explore codebase →</TextLink>
      </section>

      {/* Acceptance criteria */}
      <section aria-labelledby="acceptance-criteria-heading" className="mb-8">
        <h4
          id="acceptance-criteria-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted"
        >
          Acceptance Criteria
        </h4>
        <ul className="flex flex-col gap-2">
          {criteriaLines.map((line, index) => (
            // Criteria lines are static content without stable keys — index is safe here
            <li key={index} className="flex gap-2 text-text-primary">
              <span className="mt-1 shrink-0 text-accent" aria-hidden="true">
                •
              </span>
              {line}
            </li>
          ))}
        </ul>
      </section>

      {/* Action */}
      {task.status === 'ASSIGNED' && (
        <Button onClick={handleStart} disabled={isStarting}>
          {isStarting ? 'Starting…' : 'Start task'}
        </Button>
      )}

      {task.status === 'IN_PROGRESS' && (
        <Button variant="secondary" disabled>
          Continue
        </Button>
      )}
    </article>
  )
}

/** Panel tab that shows today's assigned task and lets the player start it. */
export default function TaskBoardPage() {
  const { task, isLoading, error, startTask } = useTask()

  return (
    <div className="overflow-y-auto p-6">
      {isLoading && <p className="text-text-muted">Loading today's task…</p>}
      {!isLoading && error && <p className="text-danger">{error}</p>}
      {!isLoading && !error && !task && (
        <p className="text-text-muted">No task assigned for today.</p>
      )}
      {!isLoading && !error && task && <TaskDetail task={task} onStartTask={startTask} />}
    </div>
  )
}
