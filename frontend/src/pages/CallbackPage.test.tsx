import { render, screen, waitFor } from '@testing-library/react'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CallbackPage from './CallbackPage'
import { authState } from '../test/helpers'
import { LocationProbe } from '../test/LocationProbe'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const LOADING_MESSAGE = 'Completing login…'

function renderCallback() {
  render(
    <MemoryRouter initialEntries={['/callback']}>
      <LocationProbe />
      <CallbackPage />
    </MemoryRouter>,
  )
}

describe('CallbackPage', () => {
  it('waits while Auth0 processes the login', () => {
    vi.mocked(useAuth0).mockReturnValue(authState({ isLoading: true, isAuthenticated: false }))

    renderCallback()

    expect(screen.getByText(LOADING_MESSAGE)).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/callback')
  })

  it('goes to the room once authenticated', async () => {
    vi.mocked(useAuth0).mockReturnValue(authState())

    renderCallback()

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/room'))
  })

  // Known bug: `error` is never read, so the player waits forever. https://trello.com/c/vnH7h4Wt
  // When fixed this test starts passing: drop `.fails`.
  it.fails('stops waiting when Auth0 returns an error', () => {
    vi.mocked(useAuth0).mockReturnValue(
      authState({ isAuthenticated: false, error: new Error('access_denied') }),
    )

    renderCallback()

    expect(screen.queryByText(LOADING_MESSAGE)).not.toBeInTheDocument()
  })
})
