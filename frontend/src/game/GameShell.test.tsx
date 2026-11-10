import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { Link, MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameShell } from './GameShell'
import type { PanelTab } from '../components/PanelWindow'
import { authState, settle, stubApi } from '../test/helpers'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const ROUTES = {
  'GET /api/profile': { id: 1 },
  'GET /api/tasks/today': { status: 'IN_PROGRESS' },
  'GET /api/progress': {
    level: 'X',
    totalXp: 150,
    xpToday: 0,
    currentStreak: 3,
    longestStreak: 3,
    approvedTodayTaskTitle: null,
  },
}

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>count {count}</button>
}

const TABS: PanelTab[] = [{ path: 'task', label: 'Task Board', element: <Counter /> }]

function Room() {
  return (
    <>
      <Link to="/room/task">open panel</Link>
      <Outlet />
    </>
  )
}

function renderShell(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<GameShell tabs={TABS} />}>
          <Route path="/room" element={<Room />}>
            <Route path="task" element={null} />
            <Route path="end-of-day" element={<p>end of day</p>} />
          </Route>
          <Route path="/profile" element={<p>profile page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const breadcrumb = () => screen.getByRole('navigation', { name: 'Breadcrumb', hidden: true })
const avatar = () => screen.getByRole('button', { name: 'Account menu', hidden: true })

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(avatar())
}

async function goToProfile(user: ReturnType<typeof userEvent.setup>) {
  await openMenu(user)
  await user.click(screen.getByRole('link', { name: 'Profile' }))
}

describe('GameShell', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it.each([
    ['/room', /^Room$/],
    ['/room/task', 'Room / Task Board'],
    ['/room/end-of-day', 'Room / End of Day'],
    ['/profile', 'Room / Profile'],
  ])('shows the breadcrumb for %s', async (path, expected) => {
    stubApi(ROUTES)

    renderShell(path)
    await settle()

    expect(breadcrumb()).toHaveTextContent(expected)
  })

  it('keeps the bar usable in the room and on the profile page', async () => {
    stubApi(ROUTES)

    renderShell('/profile')
    await settle()

    expect(avatar().closest('[inert]')).toBeNull()
  })

  it.each(['/room/task', '/room/end-of-day'])('makes the bar inert on %s', async (path) => {
    stubApi(ROUTES)

    renderShell(path)
    await settle()

    expect(avatar().closest('[inert]')).not.toBeNull()
  })

  it('keeps a tab state across a visit to the profile page', async () => {
    stubApi(ROUTES)
    const user = renderShell('/room/task')
    await settle()

    await user.click(screen.getByRole('button', { name: 'count 0' }))
    await user.click(screen.getByRole('link', { name: /Back to room/ }))
    await goToProfile(user)
    expect(screen.getByText('profile page')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Room' }))
    await user.click(screen.getByRole('link', { name: 'open panel' }))

    expect(screen.getByRole('button', { name: 'count 1' })).toBeVisible()
  })

  it('runs the session checks once across pages', async () => {
    const fetchMock = stubApi(ROUTES)
    const user = renderShell('/room')
    await settle()

    await goToProfile(user)
    await user.click(screen.getByRole('link', { name: 'Room' }))
    await settle()

    const profileRequests = fetchMock.mock.calls.filter(([url]) => url.endsWith('/api/profile'))
    expect(profileRequests).toHaveLength(1)
  })

  it('logs out back to the app origin', async () => {
    const auth = authState()
    vi.mocked(useAuth0).mockReturnValue(auth)
    stubApi(ROUTES)
    const user = renderShell('/room')
    await settle()

    await openMenu(user)
    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(auth.logout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin },
    })
  })
})
