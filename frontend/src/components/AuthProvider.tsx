import { type ReactNode } from 'react'
import { Auth0Provider, type AppState } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'

/** Auth0Provider connected to the router, so login returns to the page that required it. Render it inside the router. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  const returnToPage = (appState?: AppState) => {
    navigate(appState?.returnTo ?? '/room', { replace: true })
  }

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/callback`,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
      onRedirectCallback={returnToPage}
    >
      {children}
    </Auth0Provider>
  )
}
