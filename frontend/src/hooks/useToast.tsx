import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Toast, type ToastTone } from '../components/Toast'

export interface ToastMessage {
  tone: ToastTone
  title: string
  message: string
}

const SUCCESS_TIMEOUT_MS = 6000

const ToastContext = createContext<{ showToast: (toast: ToastMessage) => void } | null>(null)

/**
 * One toast at a time, bottom-right over the room and every panel (Figma: 48px from the edges).
 * Lives in GameShell so a toast outlives the tab that raised it. Errors stay until dismissed.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  // A copy, so showing the same message again is a new toast with a fresh timer.
  const value = useMemo(() => ({ showToast: (next: ToastMessage) => setToast({ ...next }) }), [])

  // A new toast is a new object, so this restarts the timer for it.
  useEffect(() => {
    if (toast?.tone !== 'success') return
    const timer = setTimeout(() => setToast(null), SUCCESS_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed right-12 bottom-12 z-30">
          <Toast {...toast} onDismiss={() => setToast(null)} />
        </div>
      )}
    </ToastContext.Provider>
  )
}

/** Shows a toast. Must be used inside ToastProvider. */
// oxlint-disable-next-line react/only-export-components -- provider and hook belong together
export function useToast(): { showToast: (toast: ToastMessage) => void } {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}
