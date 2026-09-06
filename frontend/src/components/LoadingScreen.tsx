/** Full-screen centered loading indicator. Used by App.tsx during auth initialisation and by CallbackPage. */
export function LoadingScreen({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base">
      <p className="text-text-muted">{message}</p>
    </div>
  )
}
