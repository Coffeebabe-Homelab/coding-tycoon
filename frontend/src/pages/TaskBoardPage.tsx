import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTask } from '../hooks/useTask'
import { LoadingScreen } from '../components/LoadingScreen'
import type { Task } from '../types/task'

/** Maps a difficulty string to its badge colour classes. */
function difficultyClasses(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-success/20 text-success'
    case 'medium':
      return 'bg-warning/20 text-warning'
    case 'hard':
      return 'bg-danger/20 text-danger'
    default:
      return 'bg-bg-elevated text-text-muted'
  }
}

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
    <div className="rounded-xl border border-border bg-bg-surface p-8">
      {/* Header row — title + difficulty badge */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text-primary">{task.title}</h1>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${difficultyClasses(task.difficulty)}`}
        >
          {task.difficulty}
        </span>
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent-subtle px-2 py-0.5 text-xs text-accent-hover"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="mb-6 leading-relaxed text-text-primary">{task.description}</p>

      {/* Acceptance criteria */}
      <section aria-labelledby="acceptance-criteria-heading" className="mb-8">
        <h2
          id="acceptance-criteria-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted"
        >
          Acceptance Criteria
        </h2>
        <ul className="flex flex-col gap-2">
          {criteriaLines.map((line, index) => (
            // Criteria lines are static content without stable keys — index is safe here
            // eslint-disable-next-line react/no-array-index-key
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
        <button
          type="button"
          onClick={handleStart}
          disabled={isStarting}
          className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-hover focus:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isStarting ? 'Starting…' : 'Start task'}
        </button>
      )}

      {task.status === 'IN_PROGRESS' && (
        <button
          type="button"
          disabled
          className="rounded-lg bg-bg-elevated px-6 py-2 text-sm font-medium text-success focus:outline-none disabled:cursor-not-allowed"
        >
          Continue
        </button>
      )}
    </div>
  )
}

/** Page that shows today's assigned task and lets the player start it. */
export default function TaskBoardPage() {
  const { task, isLoading, error, startTask } = useTask()

  if (isLoading) return <LoadingScreen message="Loading today's task…" />

  return (
    <div className="flex min-h-screen flex-col items-start bg-bg-base px-10 py-8">
      <Link
        to="/room"
        className="mb-8 text-sm text-accent transition-colors hover:text-accent-hover focus:text-accent-hover focus:outline-none focus:underline"
      >
        ← Back to room
      </Link>

      {error && (
        <div className="w-full max-w-2xl">
          <p className="text-danger">{error}</p>
        </div>
      )}

      {!error && !task && (
        <div className="w-full max-w-2xl">
          <p className="text-text-muted">No task assigned for today.</p>
        </div>
      )}

      {!error && task && (
        <div className="w-full max-w-2xl">
          <TaskDetail task={task} onStartTask={startTask} />
        </div>
      )}
    </div>
  )
}
