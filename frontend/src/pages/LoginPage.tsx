import { useAuth0 } from '@auth0/auth0-react'
import { Button } from '../components/Button'

/** Public login page — centred card with title and Auth0 login button. */
export default function LoginPage() {
  const { loginWithRedirect } = useAuth0()

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-bg-surface p-10">
        <h1 className="font-display text-3xl font-bold text-text-primary">Coding Tycoon</h1>
        <p className="text-sm text-text-muted">Learn real developer skills. One day at a time.</p>
        <Button onClick={() => loginWithRedirect()}>Log in</Button>
      </div>
    </div>
  )
}
