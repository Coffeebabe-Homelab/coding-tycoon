import { StrictMode } from 'react'
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

  // renderToString runs render but never effects, so this holds only while the redirect is in an effect.
  it('does not start the redirect during render', () => {
    const auth = authState({ isAuthenticated: false })
    vi.mocked(useAuth0).mockReturnValue(auth)

    renderToString(guarded())

    expect(auth.loginWithRedirect).not.toHaveBeenCalled()
  })

  it('starts only one redirect under StrictMode', () => {
    const auth = authState({ isAuthenticated: false })
    vi.mocked(useAuth0).mockReturnValue(auth)

    render(<StrictMode>{guarded()}</StrictMode>)

    expect(auth.loginWithRedirect).toHaveBeenCalledTimes(1)
  })

  it('remembers the deep link for after login', () => {
    const auth = authState({ isAuthenticated: false })
    vi.mocked(useAuth0).mockReturnValue(auth)

    render(guarded('/room/codebase?file=a.md'))

    expect(auth.loginWithRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ appState: { returnTo: '/room/codebase?file=a.md' } }),
    )
  })
})
