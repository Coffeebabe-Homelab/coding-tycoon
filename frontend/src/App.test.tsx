import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { authState, stubApi } from './test/helpers'
import { LocationProbe } from './test/LocationProbe'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const ROOM_ROUTES = {
  'GET /api/profile': { id: 1, language: 'Java', framework: 'Spring Boot', seniority: 'Mid', topics: [] },
  'GET /api/tasks/today': { status: 'IN_PROGRESS' },
  'GET /api/progress': {
    totalXp: 0,
    xpToday: 0,
    currentStreak: 0,
    longestStreak: 0,
    approvedTodayTaskTitle: null,
  },
  'GET /api/topics': [],
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <LocationProbe />
      <App />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const location = () => screen.getByTestId('location')

describe('App routing', () => {
  it('shows a loading screen while auth is resolving', () => {
    vi.mocked(useAuth0).mockReturnValue(authState({ isLoading: true, isAuthenticated: false }))

    renderAt('/')

    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('sends a visitor from / to the login page, whose button starts the Auth0 login', async () => {
    const auth = authState({ isAuthenticated: false })
    vi.mocked(useAuth0).mockReturnValue(auth)

    const user = renderAt('/')

    expect(location()).toHaveTextContent('/login')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(auth.loginWithRedirect).toHaveBeenCalled()
  })

  it('sends a logged-in player from / to the room', async () => {
    stubApi(ROOM_ROUTES)
    vi.mocked(useAuth0).mockReturnValue(authState())

    renderAt('/')

    expect(location()).toHaveTextContent('/room')
    expect(await screen.findByRole('group', { name: 'Your developer room' })).toBeInTheDocument()
  })

  it('redirects the old /profile URL to the profile panel inside the room', async () => {
    stubApi(ROOM_ROUTES)
    vi.mocked(useAuth0).mockReturnValue(authState())

    renderAt('/profile')

    expect(location()).toHaveTextContent('/room/profile')
    expect(await screen.findByRole('dialog', { name: 'Player Profile' })).toBeInTheDocument()
  })

  it.each(['/room', '/onboarding'])('protects %s from anonymous visitors', (path) => {
    const auth = authState({ isAuthenticated: false })
    vi.mocked(useAuth0).mockReturnValue(auth)

    renderAt(path)

    expect(auth.loginWithRedirect).toHaveBeenCalled()
    expect(screen.queryByRole('group', { name: 'Your developer room' })).not.toBeInTheDocument()
    expect(screen.queryByText('Step 1 of 3')).not.toBeInTheDocument()
  })
})
