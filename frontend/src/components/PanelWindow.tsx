import { Activity, useState, type ReactNode } from 'react'
import { Link, NavLink, matchPath, useLocation } from 'react-router-dom'
import { useModalDialog } from '../hooks/useModalDialog'
import { Icon } from './Icon'

export interface PanelTab {
  /** Route segment under /room. */
  path: string
  label: string
  element: ReactNode
}

interface PanelWindowProps {
  /** Only tabs that have a route: a tab that goes nowhere stays out of the bar. */
  tabs: PanelTab[]
}

const TAB_CLASSES =
  'flex h-full items-center border-b-2 px-4 text-label-m transition-colors hover:bg-bg-elevated hover:text-text-primary'

/**
 * The one window for all room tools. It stays mounted in GameShell, so visited tabs live on
 * hidden in <Activity> and start from where the player left them.
 */
export function PanelWindow({ tabs }: PanelWindowProps) {
  const { pathname } = useLocation()
  const activeTab = tabs.find((tab) => matchPath(`/room/${tab.path}`, pathname))
  const dialogRef = useModalDialog(activeTab !== undefined)
  const [visited, setVisited] = useState<string[]>([])

  if (activeTab && !visited.includes(activeTab.path)) setVisited([...visited, activeTab.path])

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={activeTab?.label}
      tabIndex={-1}
      hidden={!activeTab}
      className="fixed inset-x-8 top-20 bottom-8 z-10 flex flex-col overflow-hidden rounded-xl border border-border bg-bg-surface shadow-overlay focus:outline-none"
    >
      <header className="flex h-[47px] shrink-0 items-center justify-between border-b border-border pr-4 pl-2">
        <nav aria-label="Panels" className="flex h-full">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={`/room/${tab.path}`}
              // Back closes the panel instead of walking back through tabs.
              replace
              className={({ isActive }) =>
                `${TAB_CLASSES} ${isActive ? 'border-accent text-text-primary' : 'border-transparent text-text-muted'}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/room"
          className="flex items-center gap-2 text-label-m text-text-muted transition-colors hover:text-text-primary"
        >
          <Icon name="arrow-left" />
          Back to room
          <kbd className="rounded-sm border border-border px-1 font-mono text-code-s">Esc</kbd>
        </Link>
      </header>
      {tabs
        .filter((tab) => visited.includes(tab.path))
        .map((tab) => (
          // `hidden` lives outside Activity so it applies at once, for the focus trap.
          <div key={tab.path} hidden={tab !== activeTab} className="flex min-h-0 flex-1 flex-col">
            <Activity mode={tab === activeTab ? 'visible' : 'hidden'}>{tab.element}</Activity>
          </div>
        ))}
    </div>
  )
}
