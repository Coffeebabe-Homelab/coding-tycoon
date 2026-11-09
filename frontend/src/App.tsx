import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import ProtectedRoute from './components/ProtectedRoute'
import { LoadingScreen } from './components/LoadingScreen'
import { PanelWindow, type PanelTab } from './components/PanelWindow'
import LoginPage from './pages/LoginPage'
import CallbackPage from './pages/CallbackPage'
import EndOfDayPage from './pages/EndOfDayPage'
import GameRoomPage from './pages/GameRoomPage'
import OnboardingPage from './pages/OnboardingPage'
import ProfilePage from './pages/ProfilePage'
import TaskBoardPage from './pages/TaskBoardPage'
import CodebaseExplorerPage from './pages/CodebaseExplorerPage'

// Add a tab here only once it has a route; the window builds its bar and routes from this list.
const PANEL_TABS: PanelTab[] = [
  { path: 'task', label: 'Task Board', element: <TaskBoardPage /> },
  { path: 'codebase', label: 'Codebase', element: <CodebaseExplorerPage /> },
]

function App() {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      {/* Panels are nested routes. Tabs render inside PanelWindow, the rest through its outlet. */}
      <Route
        path="/room"
        element={
          <ProtectedRoute>
            <GameRoomPage />
          </ProtectedRoute>
        }
      >
        <Route element={<PanelWindow tabs={PANEL_TABS} />}>
          {/* Keeps the window mounted on /room, so visited tabs survive closing the panel. */}
          <Route index element={null} />
          {PANEL_TABS.map((tab) => (
            <Route key={tab.path} path={tab.path} element={null} />
          ))}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="end-of-day" element={<EndOfDayPage />} />
        </Route>
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
      <Route path="/" element={<Navigate to={isAuthenticated ? '/room' : '/login'} replace />} />
    </Routes>
  )
}

export default App
