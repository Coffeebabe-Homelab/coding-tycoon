import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('goes to the login page when opened without a login in progress', async () => {
    vi.mocked(useAuth0).mockReturnValue(authState({ isAuthenticated: false }))

    renderCallback()

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'))
  })

  describe('when Auth0 returns an error', () => {
    const failedLogin = () =>
      authState({ isAuthenticated: false, error: new Error('access_denied') })

    it('stops waiting, says so and stays on the page', () => {
      vi.mocked(useAuth0).mockReturnValue(failedLogin())

      renderCallback()

      expect(screen.queryByText(LOADING_MESSAGE)).not.toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent("We couldn't log you in.")
      expect(screen.getByTestId('location')).toHaveTextContent('/callback')
    })

    it('lets the player try again', async () => {
      const auth = failedLogin()
      vi.mocked(useAuth0).mockReturnValue(auth)

      renderCallback()
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

      expect(auth.loginWithRedirect).toHaveBeenCalled()
    })

    it('lets the player log out', async () => {
      const auth = failedLogin()
      vi.mocked(useAuth0).mockReturnValue(auth)

      renderCallback()
      await userEvent.click(screen.getByRole('button', { name: 'Log out' }))

      expect(auth.logout).toHaveBeenCalledWith({
        logoutParams: { returnTo: window.location.origin },
      })
    })
  })
})
