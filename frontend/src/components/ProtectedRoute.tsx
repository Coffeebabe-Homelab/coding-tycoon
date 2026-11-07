import { useEffect, useRef, type ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useLocation } from 'react-router-dom'
import { LoadingScreen } from './LoadingScreen'

interface Props {
  children: ReactNode
}

/**
 * Wraps a route and redirects unauthenticated users to Auth0 login, remembering the page they asked for.
 * Shows a loading state while the auth state is being determined and during the redirect.
 */
const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const { pathname, search } = useLocation()
  // StrictMode runs effects twice in development; only one redirect may start.
  const redirectStarted = useRef(false)

  useEffect(() => {
    if (isLoading || isAuthenticated || redirectStarted.current) return
    redirectStarted.current = true
    loginWithRedirect({ appState: { returnTo: `${pathname}${search}` } })
  }, [isLoading, isAuthenticated, loginWithRedirect, pathname, search])

  return !isLoading && isAuthenticated ? <>{children}</> : <LoadingScreen />
}

export default ProtectedRoute
