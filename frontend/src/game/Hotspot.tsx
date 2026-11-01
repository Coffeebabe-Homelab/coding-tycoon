import type { KeyboardEvent, ReactNode } from 'react'

interface HotspotProps {
  label: string
  /** Omit to render a disabled hotspot (panel not built yet); `label` then explains why. */
  onActivate?: () => void
  children: ReactNode
}

/**
 * Clickable object in the SVG room. SVG has no native <button>, so it gets the button role,
 * keyboard activation (Enter/Space) and a tooltip via <title>.
 */
export function Hotspot({ label, onActivate, children }: HotspotProps) {
  const disabled = !onActivate

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (!onActivate || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    onActivate()
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={onActivate}
      onKeyDown={handleKeyDown}
      className={
        disabled
          ? 'cursor-not-allowed opacity-60 hover:opacity-80 focus:opacity-80 focus:outline-none'
          : 'cursor-pointer transition hover:brightness-125 hover:drop-shadow-hotspot focus:brightness-125 focus:outline-none focus:drop-shadow-hotspot'
      }
    >
      <title>{label}</title>
      {children}
    </g>
  )
}
