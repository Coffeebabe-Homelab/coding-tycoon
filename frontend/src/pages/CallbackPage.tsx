import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { LoadingScreen } from '../components/LoadingScreen'

/** Handles the Auth0 redirect callback. Shows a loading state while Auth0 processes the code, then navigates to /room. */
export default function CallbackPage() {
  const { isLoading, isAuthenticated } = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/room', { replace: true })
    }
  }, [isLoading, isAuthenticated, navigate])

  return <LoadingScreen message="Completing login…" />
}
