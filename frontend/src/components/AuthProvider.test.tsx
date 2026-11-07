import { act, render, screen } from '@testing-library/react'
import { Auth0Provider, type AppState, type Auth0ProviderOptions } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { LocationProbe } from '../test/LocationProbe'

vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: vi.fn(({ children }: Auth0ProviderOptions) => <>{children}</>),
}))

// Auth0ProviderOptions is a union that hides these props behind a type check.
interface ProviderProps {
  authorizationParams?: { redirect_uri?: string }
  onRedirectCallback?: (appState?: AppState) => void
}

function renderProvider() {
  render(
    <MemoryRouter initialEntries={['/callback']}>
      <LocationProbe />
      <AuthProvider>
        <p>app</p>
      </AuthProvider>
    </MemoryRouter>,
  )
  return vi.mocked(Auth0Provider).mock.lastCall![0] as unknown as ProviderProps
}

describe('AuthProvider', () => {
  it('renders the app and sends Auth0 back to /callback', () => {
    const props = renderProvider()

    expect(screen.getByText('app')).toBeInTheDocument()
    expect(props.authorizationParams?.redirect_uri).toBe(`${window.location.origin}/callback`)
  })

  it('returns to the page that required login', () => {
    const props = renderProvider()

    act(() => props.onRedirectCallback?.({ returnTo: '/room/codebase?file=a.md' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/room/codebase')
  })

  it('goes to the room when login started from the login page', () => {
    const props = renderProvider()

    act(() => props.onRedirectCallback?.(undefined))

    expect(screen.getByTestId('location')).toHaveTextContent('/room')
  })
})
