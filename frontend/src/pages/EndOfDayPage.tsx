import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { Overlay } from '../components/Overlay'
import { useProgress } from '../hooks/useProgress'
import { useTask } from '../hooks/useTask'
import type { Progress } from '../types/progress'
import type { TaskStatus } from '../types/task'

const STATUS_LABELS: Record<TaskStatus, string> = {
  ASSIGNED: 'Not started',
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Submitted for review',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED: 'Approved',
}

/** Outcome card for a task approved today. */
function ApprovedSummary({ title }: { title: string }) {
  return (
    <TaskOutcome heading="Ticket closed" title={title} status="APPROVED">
      The reviewer signed off. That's a shipped feature, nice work.
    </TaskOutcome>
  )
}

/**
 * Outcome card when nothing was approved today. Reads the active task, which only exists
 * for non-approved work (GET /api/tasks/today).
 */
function ActiveTaskSummary() {
  const { task, isLoading, error } = useTask()

  if (isLoading) return <p className="text-text-muted">Checking today's ticket…</p>
  if (error || !task) {
    return <p className="text-text-muted">No task on the board today. See you tomorrow.</p>
  }
  if (task.status === 'ASSIGNED') {
    return (
      <TaskOutcome heading="No task started today" title={task.title} status={task.status}>
        Today's ticket is still waiting on the board. Tomorrow is a fresh start.
      </TaskOutcome>
    )
  }
  return (
    <TaskOutcome heading="Still in progress" title={task.title} status={task.status}>
      Good progress. Pick it up where you left off next session.
    </TaskOutcome>
  )
}

interface TaskOutcomeProps {
  heading: string
  title: string
  status: TaskStatus
  children: string
}

function TaskOutcome({ heading, title, status, children }: TaskOutcomeProps) {
  const statusClass = status === 'APPROVED' ? 'text-success' : 'text-warning'
  return (
    <section aria-labelledby="eod-outcome-heading" className="flex flex-col gap-2">
      <h3 id="eod-outcome-heading" className="text-xl font-semibold text-text-primary">
        {heading}
      </h3>
      <p className="text-text-primary">
        {title} · <span className={statusClass}>{STATUS_LABELS[status]}</span>
      </p>
      <p className="text-text-muted">{children}</p>
    </section>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-4">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-2xl font-semibold text-text-primary">{value}</dd>
    </div>
  )
}

function ProgressStats({ progress }: { progress: Progress }) {
  return (
    <dl className="grid grid-cols-4 gap-4">
      <StatTile label="XP today" value={`+${progress.xpToday}`} />
      <StatTile label="Total XP" value={String(progress.totalXp)} />
      <StatTile label="Current streak" value={`${progress.currentStreak} d`} />
      <StatTile label="Longest streak" value={`${progress.longestStreak} d`} />
    </dl>
  )
}

/** Closes the workday: today's task outcome, XP and streak. Skill delta arrives in Phase 6. */
export default function EndOfDayPage() {
  const { progress, isLoading, error } = useProgress()
  const { logout } = useAuth0()

  return (
    <Overlay title="End of Day">
      {isLoading && <p className="text-text-muted">Wrapping up your day…</p>}
      {!isLoading && error && <p className="text-danger">{error}</p>}
      {!isLoading && progress && (
        <div className="flex flex-col gap-8">
          {progress.approvedTodayTaskTitle ? (
            <ApprovedSummary title={progress.approvedTodayTaskTitle} />
          ) : (
            <ActiveTaskSummary />
          )}
          <ProgressStats progress={progress} />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-accent hover:text-text-primary focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
            >
              Log out
            </button>
            <Link
              to="/room"
              className="rounded-lg bg-accent px-4 py-2 text-sm text-text-primary transition-colors hover:bg-accent-hover focus:bg-accent-hover focus:ring-2 focus:ring-accent focus:outline-none"
            >
              Back to room
            </Link>
          </div>
        </div>
      )}
    </Overlay>
  )
}
