import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { LoadingScreen } from '../components/LoadingScreen'
import { Button } from '../components/Button'

/**
 * Auth0 redirects here after login. A successful login is normally sent on by AuthProvider before
 * this page renders; it covers the rest: a failed login, or someone opening /callback directly.
 */
export default function CallbackPage() {
  const { isLoading, isAuthenticated, error, loginWithRedirect, logout } = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading || error) return
    navigate(isAuthenticated ? '/room' : '/login', { replace: true })
  }, [isLoading, isAuthenticated, error, navigate])

  if (!error) return <LoadingScreen message="Completing login…" />

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base">
      <div
        role="alert"
        className="flex flex-col items-center gap-6 rounded-xl border border-border bg-bg-surface p-10"
      >
        <p className="text-text-primary">We couldn't log you in.</p>
        <div className="flex gap-3">
          <Button onClick={() => loginWithRedirect()}>Try again</Button>
          <button
            type="button"
            className="rounded-md border border-border px-6 py-2 text-sm text-text-muted transition-colors hover:text-text-primary"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
