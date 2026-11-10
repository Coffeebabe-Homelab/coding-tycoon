import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'
import { authState } from '../test/helpers'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

describe('LoginPage', () => {
  it('names the game in the page heading', () => {
    vi.mocked(useAuth0).mockReturnValue(authState())
    render(<LoginPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Coding Tycoon' })).toBeInTheDocument()
  })

  it('starts the Auth0 login from the button', async () => {
    const auth = authState()
    vi.mocked(useAuth0).mockReturnValue(auth)
    render(<LoginPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(auth.loginWithRedirect).toHaveBeenCalledOnce()
  })

  it('keeps the room art out of the accessibility tree', () => {
    vi.mocked(useAuth0).mockReturnValue(authState())
    render(<LoginPage />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Your desk is waiting.')).toBeInTheDocument()
  })
})
