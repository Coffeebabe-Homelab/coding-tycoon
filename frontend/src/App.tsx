import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import ProtectedRoute from './components/ProtectedRoute'
import { LoadingScreen } from './components/LoadingScreen'
import type { PanelTab } from './components/PanelWindow'
import { GameShell } from './game/GameShell'
import LoginPage from './pages/LoginPage'
import CallbackPage from './pages/CallbackPage'
import EndOfDayPage from './pages/EndOfDayPage'
import GameRoomPage from './pages/GameRoomPage'
import OnboardingPage from './pages/OnboardingPage'
import ProfilePage from './pages/ProfilePage'
import TaskBoardPage from './pages/TaskBoardPage'
import CodebaseExplorerPage from './pages/CodebaseExplorerPage'
import EditorPage from './pages/EditorPage'

// Add a tab here only once it has a route; the window builds its bar and routes from this list.
const PANEL_TABS: PanelTab[] = [
  { path: 'task', label: 'Task Board', element: <TaskBoardPage /> },
  { path: 'codebase', label: 'Codebase', element: <CodebaseExplorerPage /> },
  { path: 'editor', label: 'Editor', element: <EditorPage /> },
]

function App() {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route
        element={
          <ProtectedRoute>
            <GameShell tabs={PANEL_TABS} />
          </ProtectedRoute>
        }
      >
        {/* Panels are nested routes. Tabs render inside the shell's PanelWindow, so theirs are empty. */}
        <Route path="/room" element={<GameRoomPage />}>
          {PANEL_TABS.map((tab) => (
            <Route key={tab.path} path={tab.path} element={null} />
          ))}
          <Route path="profile" element={<Navigate to="/profile" replace />} />
          <Route path="end-of-day" element={<EndOfDayPage />} />
        </Route>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? '/room' : '/login'} replace />} />
    </Routes>
  )
}

export default App
