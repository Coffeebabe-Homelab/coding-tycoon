import type { TaskStatus } from '../types/task'

const STATUS_STYLES: Record<TaskStatus, { label: string; classes: string }> = {
  ASSIGNED: { label: 'Assigned', classes: 'bg-info-subtle text-info' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-warning-subtle text-warning' },
  SUBMITTED: { label: 'Submitted', classes: 'bg-accent-subtle text-accent-on-subtle' },
  APPROVED: { label: 'Approved', classes: 'bg-success-subtle text-success' },
  CHANGES_REQUESTED: { label: 'Changes Requested', classes: 'bg-danger-subtle text-danger' },
}

/** Figma Status Badge (8:96). Always a dot and a word, so status never relies on colour alone. */
export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, classes } = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-label-s uppercase ${classes}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}
