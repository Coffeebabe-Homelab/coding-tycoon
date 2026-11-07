import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ProtectedRoute from './ProtectedRoute'
import { authState } from '../test/helpers'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const guarded = (path = '/room') => (
  <MemoryRouter initialEntries={[path]}>
    <ProtectedRoute>
      <p>secret room</p>
    </ProtectedRoute>
  </MemoryRouter>
)

describe('ProtectedRoute', () => {
  it('shows a loading state and neither the page nor a redirect while auth is resolving', () => {
    const auth = authState({ isLoading: true, isAuthenticated: false })
    vi.mocked(useAuth0).mockReturnValue(auth)

    render(guarded())

    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('secret room')).not.toBeInTheDocument()
    expect(auth.loginWithRedirect).not.toHaveBeenCalled()
  })

  it('shows the page to an authenticated player', () => {
    const auth = authState()
    vi.mocked(useAuth0).mockReturnValue(auth)

    render(guarded())

    expect(screen.getByText('secret room')).toBeInTheDocument()
    expect(auth.loginWithRedirect).not.toHaveBeenCalled()
  })

  it('sends an unauthenticated visitor to login without showing the page', () => {
    const auth = authState({ isAuthenticated: false })
    vi.mocked(useAuth0).mockReturnValue(auth)

    render(guarded())

    expect(auth.loginWithRedirect).toHaveBeenCalled()
    expect(screen.queryByText('secret room')).not.toBeInTheDocument()
  })

  // Known bug: loginWithRedirect runs during render. https://trello.com/c/vnH7h4Wt
  // renderToString runs render but never effects, so this holds only once it moves to an effect.
  // When fixed this test starts passing: drop `.fails`.
  it.fails('does not start the redirect during render', () => {
    const auth = authState({ isAuthenticated: false })
    vi.mocked(useAuth0).mockReturnValue(auth)

    renderToString(guarded())

    expect(auth.loginWithRedirect).not.toHaveBeenCalled()
  })

  // Known bug: the deep link is lost across the login round trip. https://trello.com/c/vnH7h4Wt
  // When fixed this test starts passing: drop `.fails`.
  it.fails('remembers the deep link for after login', () => {
    const auth = authState({ isAuthenticated: false })
    vi.mocked(useAuth0).mockReturnValue(auth)

    render(guarded('/room/codebase?file=a.md'))

    expect(auth.loginWithRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ appState: { returnTo: '/room/codebase?file=a.md' } }),
    )
  })
})
