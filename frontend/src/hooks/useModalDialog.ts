import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { trapFocus } from '../lib/focusTrap'

/**
 * Dialog behaviour for room panels while `isOpen`: takes focus, traps Tab, closes to /room on Esc,
 * and returns focus to the opener on close. Attach the returned ref to the dialog element.
 */
export function useModalDialog(isOpen: boolean): RefObject<HTMLDivElement | null> {
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [wasOpen, setWasOpen] = useState(false)
  const [opener, setOpener] = useState<HTMLElement | null>(null)

  // Captured during render, on every open: once committed the room is inert and loses focus.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    if (isOpen) setOpener(document.activeElement as HTMLElement | null)
  }

  useEffect(() => {
    if (!isOpen) return
    dialogRef.current?.focus()
    return () => opener?.focus()
  }, [isOpen, opener])

  // Separate from the focus effect: `navigate` changes on tab switches, which must not move focus.
  useEffect(() => {
    if (!isOpen) return
    // Listen on document so Esc and the trap work even if focus slipped to <body>.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isHandledElsewhere(event)) navigate('/room')
      if (event.key === 'Tab' && dialogRef.current) trapFocus(event, dialogRef.current)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, navigate])

  return dialogRef
}

// Monaco closes its find and suggestion widgets with Escape; other widgets mark theirs with preventDefault.
function isHandledElsewhere(event: KeyboardEvent): boolean {
  return (
    event.defaultPrevented ||
    (event.target instanceof Element && event.target.closest('.monaco-editor') !== null)
  )
}
