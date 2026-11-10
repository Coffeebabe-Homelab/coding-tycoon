import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GameRoomPage from './GameRoomPage'
import { GameShell } from '../game/GameShell'
import { authState, jsonResponse, settle, stubApi } from '../test/helpers'
import { LocationProbe } from '../test/LocationProbe'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const PROGRESS = {
  level: 'X',
  totalXp: 150,
  xpToday: 100,
  currentStreak: 3,
  longestStreak: 5,
  approvedTodayTaskTitle: null,
}

// A started task, so useSessionFlow leaves the player in the room.
const ROOM_ROUTES = {
  'GET /api/profile': { id: 1 },
  'GET /api/tasks/today': { status: 'IN_PROGRESS' },
  'GET /api/progress': PROGRESS,
}

function renderRoom(path = '/room') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <LocationProbe />
      <Routes>
        <Route element={<GameShell tabs={[]} />}>
          <Route path="/room" element={<GameRoomPage />}>
            <Route path="task" element={<p>task panel</p>} />
          </Route>
        </Route>
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const location = () => screen.getByTestId('location')
const hotspot = (name: RegExp) => screen.getByRole('button', { name })

describe('GameRoomPage', () => {
  let auth: ReturnType<typeof authState>

  beforeEach(() => {
    auth = authState()
    vi.mocked(useAuth0).mockReturnValue(auth)
  })

  it('sends a player with no profile (404) to onboarding', async () => {
    stubApi({ ...ROOM_ROUTES, 'GET /api/profile': jsonResponse({}, 404) })

    renderRoom()

    await waitFor(() => expect(location()).toHaveTextContent('/onboarding'))
  })

  it('stays in the room when the profile request fails for another reason', async () => {
    stubApi({ ...ROOM_ROUTES, 'GET /api/profile': jsonResponse({}, 500) })

    renderRoom()
    await settle()

    expect(location()).toHaveTextContent(/^\/room$/)
    expect(screen.getByRole('group', { name: 'Your developer room' })).toBeInTheDocument()
  })

  it('shows the progress in the App Bar', async () => {
    stubApi(ROOM_ROUTES)

    renderRoom()

    expect(await screen.findByText('LV X · 150 XP')).toBeInTheDocument()
    expect(screen.getByText('3-day streak')).toBeInTheDocument()
  })

  it('hides the stats but keeps the room usable when progress fails', async () => {
    stubApi({ ...ROOM_ROUTES, 'GET /api/progress': jsonResponse({}, 500) })

    renderRoom()
    await settle()

    expect(screen.queryByText(/XP/)).not.toBeInTheDocument()
    expect(hotspot(/Kanban board/)).toBeInTheDocument()
  })

  it('offers the wrap-up link only after an approval today', async () => {
    stubApi({
      ...ROOM_ROUTES,
      'GET /api/progress': { ...PROGRESS, approvedTodayTaskTitle: 'Add endpoint' },
    })

    renderRoom()

    expect(await screen.findByRole('link', { name: /wrap up the day/ })).toHaveAttribute(
      'href',
      '/room/end-of-day',
    )
  })

  it.each([
    [/Kanban board/, '/room/task'],
    [/Door/, '/room/end-of-day'],
    [/Computer/, '/room/codebase'],
  ])('opens the right panel from hotspot %s', async (name, path) => {
    stubApi(ROOM_ROUTES)
    const user = renderRoom()
    await settle()

    await user.click(hotspot(name))

    expect(location()).toHaveTextContent(path)
  })

  it('opens a hotspot from the keyboard', async () => {
    stubApi(ROOM_ROUTES)
    const user = renderRoom()
    await settle()

    hotspot(/Kanban board/).focus()
    await user.keyboard('{Enter}')

    expect(location()).toHaveTextContent('/room/task')
  })

  it('makes the room inert while a panel is open', async () => {
    stubApi(ROOM_ROUTES)

    renderRoom('/room/task')
    await settle()

    expect(screen.getByText('task panel')).toBeInTheDocument()
    expect(hotspot(/Kanban board/).closest('[inert]')).not.toBeNull()
  })

  it('keeps the room interactive with no panel open', async () => {
    stubApi(ROOM_ROUTES)

    renderRoom()
    await settle()

    expect(hotspot(/Kanban board/).closest('[inert]')).toBeNull()
  })

  it('refetches progress when a panel opens, so the HUD stays current', async () => {
    const fetchMock = stubApi(ROOM_ROUTES)
    const user = renderRoom()
    await settle()
    const progressCalls = () =>
      fetchMock.mock.calls.filter(([url]) => url.endsWith('/api/progress')).length
    expect(progressCalls()).toBe(1)

    await user.click(hotspot(/Kanban board/))
    await settle()

    expect(progressCalls()).toBe(2)
  })
})
