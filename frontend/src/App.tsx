import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import ProtectedRoute from './components/ProtectedRoute'
import { LoadingScreen } from './components/LoadingScreen'
import LoginPage from './pages/LoginPage'
import CallbackPage from './pages/CallbackPage'
import GameRoomPage from './pages/GameRoomPage'
import OnboardingPage from './pages/OnboardingPage'
import ProfilePage from './pages/ProfilePage'
import TaskBoardPage from './pages/TaskBoardPage'
import CodebaseExplorerPage from './pages/CodebaseExplorerPage'

function App() {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      {/* Panels are nested routes: they render as overlays inside the room's outlet. */}
      <Route
        path="/room"
        element={
          <ProtectedRoute>
            <GameRoomPage />
          </ProtectedRoute>
        }
      >
        <Route path="task" element={<TaskBoardPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route path="/profile" element={<Navigate to="/room/profile" replace />} />
      <Route
        path="/room/codebase"
        element={
          <ProtectedRoute>
            <CodebaseExplorerPage />
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
