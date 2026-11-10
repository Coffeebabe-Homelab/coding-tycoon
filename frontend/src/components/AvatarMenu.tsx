import { useEffect, useId, useRef, useState, type FocusEvent } from 'react'
import { Link } from 'react-router-dom'

interface AvatarMenuProps {
  email?: string
  onLogout: () => void
}

const ITEM_CLASSES =
  'block w-full rounded-sm px-3 py-2 text-left text-body-m text-text-primary transition-colors hover:bg-accent-subtle'

/**
 * The App Bar's avatar and its account menu (Figma 117:347). A disclosure: a button that shows a
 * link and a button, reached with Tab. Positioned against the App Bar, which is `relative`.
 */
export function AvatarMenu({ email, onLogout }: AvatarMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      avatarRef.current?.focus()
    }
    document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  // relatedTarget is null when focus goes nowhere, such as a click on the email text.
  const closeWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
  }

  return (
    <div ref={containerRef} onBlur={closeWhenFocusLeaves}>
      <button
        ref={avatarRef}
        type="button"
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen(!isOpen)}
        className="flex size-8 items-center justify-center rounded-full border border-accent bg-accent-subtle text-label-s text-accent-on-subtle"
      >
        P1
      </button>
      {isOpen && (
        <div
          id={menuId}
          className="absolute top-full right-6 z-20 mt-[9px] flex w-60 flex-col gap-1 rounded-lg border border-border-strong bg-bg-elevated p-2 shadow-overlay"
        >
          <p className="truncate px-3 py-2 text-label-s text-text-muted">{email}</p>
          <div className="h-px bg-border" />
          <Link to="/profile" onClick={() => setIsOpen(false)} className={ITEM_CLASSES}>
            Profile
          </Link>
          <button type="button" onClick={onLogout} className={ITEM_CLASSES}>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
