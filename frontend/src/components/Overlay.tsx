import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { trapFocus } from '../lib/focusTrap'

interface OverlayProps {
  title: string
  children: ReactNode
  /** Full-height, wide panel with an unpadded body, for panels that manage their own layout. */
  wide?: boolean
}

/**
 * Modal panel shown over the room. The open panel lives in the URL (nested route),
 * so closing means navigating back to /room; the browser back button works too.
 */
export function Overlay({ title, children, wide = false }: OverlayProps) {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const headingId = useId()
  // Captured during render: once mounted the room becomes inert and loses focus.
  const [opener] = useState(() => document.activeElement as HTMLElement | null)

  useEffect(() => {
    panelRef.current?.focus()

    // Listen on document so Esc and the trap work even if focus slipped to <body>.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') navigate('/room')
      if (event.key === 'Tab' && panelRef.current) trapFocus(event, panelRef.current)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      opener?.focus()
    }
  }, [navigate, opener])

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
        className={`flex max-h-full w-full flex-col rounded-xl border border-border bg-bg-surface shadow-2xl focus:outline-none ${wide ? 'h-full max-w-7xl' : 'max-w-3xl'}`}
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id={headingId} className="text-lg font-semibold text-text-primary">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => navigate('/room')}
            className="rounded-lg px-2 text-xl text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary focus:bg-bg-elevated focus:text-text-primary focus:ring-2 focus:ring-accent focus:outline-none"
          >
            ×
          </button>
        </header>
        <div className={wide ? 'flex min-h-0 flex-1 flex-col' : 'overflow-y-auto p-6'}>
          {children}
        </div>
      </div>
    </div>
  )
}
