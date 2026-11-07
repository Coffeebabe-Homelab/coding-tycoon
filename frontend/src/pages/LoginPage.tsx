import { useAuth0 } from '@auth0/auth0-react'

/** Public login page — centred card with title and Auth0 login button. */
export default function LoginPage() {
  const { loginWithRedirect } = useAuth0()

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-bg-surface p-10">
        <h1 className="text-3xl font-bold text-text-primary">Coding Tycoon</h1>
        <p className="text-sm text-text-muted">Learn real developer skills. One day at a time.</p>
        <button
          type="button"
          className="rounded-lg bg-accent px-6 py-2 text-sm text-text-primary transition-colors hover:bg-accent-hover focus:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
          onClick={() => loginWithRedirect()}
        >
          Log in
        </button>
      </div>
    </div>
  )
}
