import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { trapFocus } from '../lib/focusTrap'
import { Button } from './Button'

interface ModalProps {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Figma Modal: asks before a consequential action, never for navigation. Starts on Cancel so a
 * stray Enter can't confirm. Esc cancels without closing the panel underneath. Focus returns to
 * the opener if it can still take it; otherwise the caller moves focus in `onConfirm`.
 */
export function Modal({ title, children, confirmLabel, onConfirm, onCancel }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    return () => {
      if (opener?.isConnected && !opener.matches(':disabled')) opener.focus()
    }
  }, [])

  // Handled here and stopped, so the panel's own Esc and Tab handling (on document) never sees it.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    } else if (event.key === 'Tab' && dialogRef.current) {
      trapFocus(event.nativeEvent, dialogRef.current)
    } else return
    event.stopPropagation()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-bg-base/70 p-8">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-xl border border-border bg-bg-surface p-6 shadow-overlay"
      >
        <h2 id={titleId} className="mb-2 text-lg font-semibold text-text-primary">
          {title}
        </h2>
        <div id={bodyId} className="mb-6 text-sm text-text-muted">
          {children}
        </div>
        <div className="flex justify-end gap-3">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
