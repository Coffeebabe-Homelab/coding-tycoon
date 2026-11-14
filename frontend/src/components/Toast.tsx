import { Icon } from './Icon'

export type ToastTone = 'success' | 'error'

interface ToastProps {
  tone: ToastTone
  title: string
  message: string
  onDismiss: () => void
}

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'bg-success-subtle text-success',
  error: 'bg-danger-subtle text-danger',
}

/**
 * Figma Toast (9:220), Success and Error types; Loading arrives with the Phase 5 review.
 * An error is an `alert` so screen readers interrupt; a success is a polite `status`.
 */
export function Toast({ tone, title, message, onDismiss }: ToastProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="flex w-96 items-start gap-3 rounded-lg border border-border-strong bg-bg-elevated px-4 py-3 shadow-overlay"
    >
      <span
        aria-hidden="true"
        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[tone]}`}
      >
        <Icon name={tone === 'error' ? 'x' : 'check'} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-label-m text-text-primary">{title}</p>
        <p className="text-label-s text-text-muted">{message}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="rounded-md p-1 text-text-muted transition-colors hover:text-text-primary"
      >
        <Icon name="x" />
      </button>
    </div>
  )
}
