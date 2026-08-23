import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import ProtectedRoute from './components/ProtectedRoute'

/** Placeholder page — replaced in Phase 7 with the isometric room scene */
const GameRoomPage = () => {
  const { user, logout, getAccessTokenSilently } = useAuth0()

  // DEV ONLY: log the access token so we can verify it against the backend.
  // Remove before Phase 1 ships.
  useEffect(() => {
    getAccessTokenSilently()
      .then((token) => {
        console.debug('[dev] access token:', token)
      })
      .catch(console.error)
  }, [getAccessTokenSilently])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 text-white">
      <h1 className="text-2xl font-semibold">Coding Tycoon</h1>
      <p className="text-gray-400">Welcome, {user?.email}</p>
      <button
        className="rounded-lg bg-purple-600 px-4 py-2 text-sm hover:bg-purple-500"
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      >
        Log out
      </button>
    </div>
  )
}

/** Handles the Auth0 redirect callback — just navigate home, Auth0Provider processes the code */
const CallbackPage = () => {
  const { isLoading } = useAuth0()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
        Completing login…
      </div>
    )
  }

  return <Navigate to="/room" replace />
}

const LoginPage = () => {
  const { loginWithRedirect } = useAuth0()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 text-white">
      <h1 className="text-2xl font-semibold">Coding Tycoon</h1>
      <button
        className="rounded-lg bg-purple-600 px-4 py-2 text-sm hover:bg-purple-500"
        onClick={() => loginWithRedirect()}
      >
        Log in
      </button>
    </div>
  )
}

function App() {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
        Loading…
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route
        path="/room"
        element={
          <ProtectedRoute>
            <GameRoomPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/room' : '/login'} replace />}
      />
    </Routes>
  )
}

export default App
