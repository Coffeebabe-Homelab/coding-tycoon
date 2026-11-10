import { Outlet, matchPath, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { AppBar } from '../components/AppBar'
import { PanelWindow, type PanelTab } from '../components/PanelWindow'
import { useProgress } from '../hooks/useProgress'
import { useSessionFlow } from '../hooks/useSessionFlow'

const OTHER_PAGES = [
  { path: '/room/end-of-day', label: 'End of Day' },
  { path: '/profile', label: 'Profile' },
]

interface GameShellProps {
  tabs: PanelTab[]
}

/**
 * Layout around the room and the Profile page. The App Bar and PanelWindow live here so that
 * moving between those pages keeps the player's kept tabs and fetches progress only once.
 */
export function GameShell({ tabs }: GameShellProps) {
  const { user, logout } = useAuth0()
  const { pathname } = useLocation()
  const isPanelOpen = matchPath('/room/*', pathname) !== null && !matchPath('/room', pathname)
  // Refetch when a panel opens or closes so the bar matches what the panel just showed.
  const { progress } = useProgress(isPanelOpen)
  useSessionFlow()

  const pages = [...tabs.map((tab) => ({ ...tab, path: `/room/${tab.path}` })), ...OTHER_PAGES]
  const panelLabel = pages.find((page) => matchPath(page.path, pathname))?.label

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-base text-text-primary">
      <div inert={isPanelOpen}>
        <AppBar
          email={user?.email}
          panelLabel={panelLabel}
          progress={progress}
          onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        />
      </div>
      <Outlet />
      <PanelWindow tabs={tabs} />
    </div>
  )
}
