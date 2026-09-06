import { type ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

interface Props {
  children: ReactNode
}

/**
 * Wraps a route and redirects unauthenticated users to Auth0 login.
 * Shows a loading state while the auth state is being determined.
 */
const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base text-text-muted">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    loginWithRedirect()
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
