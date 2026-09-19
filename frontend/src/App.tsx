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

function App() {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <LoadingScreen />

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
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/room/task"
        element={
          <ProtectedRoute>
            <TaskBoardPage />
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
