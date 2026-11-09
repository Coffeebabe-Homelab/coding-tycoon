import { useId, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModalDialog } from '../hooks/useModalDialog'
import { Icon } from './Icon'

interface OverlayProps {
  title: string
  children: ReactNode
}

/**
 * Full-screen moment shown over the room, on a scrim. Tools use PanelWindow instead.
 * The panel lives in the URL (nested route), so closing means navigating back to /room;
 * the browser back button works too.
 */
export function Overlay({ title, children }: OverlayProps) {
  const navigate = useNavigate()
  const panelRef = useModalDialog(true)
  const headingId = useId()

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-bg-base/70 p-8"
      onClick={(event) => event.target === event.currentTarget && navigate('/room')}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className="flex max-h-full w-full max-w-3xl flex-col rounded-xl border border-border bg-bg-surface shadow-overlay focus:outline-none"
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id={headingId} className="text-lg font-semibold text-text-primary">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => navigate('/room')}
            className="rounded-md p-2 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            <Icon name="x" />
          </button>
        </header>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
