import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EndOfDayPage from './EndOfDayPage'
import { authState, jsonResponse, stubApi } from '../test/helpers'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const PROGRESS = {
  totalXp: 250,
  xpToday: 100,
  currentStreak: 3,
  longestStreak: 5,
  approvedTodayTaskTitle: null,
}
const TASK = { id: 1, title: 'Add endpoint' }

function renderEndOfDay() {
  render(
    <MemoryRouter initialEntries={['/room/end-of-day']}>
      <EndOfDayPage />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

describe('EndOfDayPage', () => {
  let auth: ReturnType<typeof authState>

  beforeEach(() => {
    auth = authState()
    vi.mocked(useAuth0).mockReturnValue(auth)
  })

  it('shows XP and streaks', async () => {
    stubApi({ 'GET /api/progress': PROGRESS, 'GET /api/tasks/today': jsonResponse({}, 404) })

    renderEndOfDay()
    expect(screen.getByText('Wrapping up your day…')).toBeInTheDocument()

    expect(await screen.findByText('+100')).toBeInTheDocument()
    expect(screen.getByText('250')).toBeInTheDocument()
    expect(screen.getByText('3 d')).toBeInTheDocument()
    expect(screen.getByText('5 d')).toBeInTheDocument()
  })

  it('celebrates a task approved today, without asking for the active task', async () => {
    const fetchMock = stubApi({
      'GET /api/progress': { ...PROGRESS, approvedTodayTaskTitle: 'Add endpoint' },
    })

    renderEndOfDay()

    expect(await screen.findByRole('heading', { name: 'Ticket closed' })).toBeInTheDocument()
    expect(screen.getByText(/Add endpoint/)).toHaveTextContent('Approved')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('notes a task that was never started', async () => {
    stubApi({ 'GET /api/progress': PROGRESS, 'GET /api/tasks/today': { ...TASK, status: 'ASSIGNED' } })

    renderEndOfDay()

    expect(await screen.findByRole('heading', { name: 'No task started today' })).toBeInTheDocument()
    expect(screen.getByText(/Add endpoint/)).toHaveTextContent('Not started')
  })

  it.each([
    ['IN_PROGRESS', 'In progress'],
    ['SUBMITTED', 'Submitted for review'],
    ['CHANGES_REQUESTED', 'Changes requested'],
  ])('notes a task still open as %s', async (status, label) => {
    stubApi({ 'GET /api/progress': PROGRESS, 'GET /api/tasks/today': { ...TASK, status } })

    renderEndOfDay()

    expect(await screen.findByRole('heading', { name: 'Still in progress' })).toBeInTheDocument()
    expect(screen.getByText(/Add endpoint/)).toHaveTextContent(label)
  })

  it('handles having no task today', async () => {
    stubApi({ 'GET /api/progress': PROGRESS, 'GET /api/tasks/today': jsonResponse({}, 404) })

    renderEndOfDay()

    expect(await screen.findByText(/No task on the board today/)).toBeInTheDocument()
  })

  it('shows the error when progress cannot load', async () => {
    stubApi({ 'GET /api/progress': jsonResponse({}, 500) })

    renderEndOfDay()

    expect(await screen.findByText('Failed to load progress')).toBeInTheDocument()
  })

  it('offers the way back and a log out', async () => {
    stubApi({ 'GET /api/progress': PROGRESS, 'GET /api/tasks/today': jsonResponse({}, 404) })
    const user = renderEndOfDay()

    expect(await screen.findByRole('link', { name: 'Back to room' })).toHaveAttribute(
      'href',
      '/room',
    )
    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(auth.logout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin },
    })
  })
})
