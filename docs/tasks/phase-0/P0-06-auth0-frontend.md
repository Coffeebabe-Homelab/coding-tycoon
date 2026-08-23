# P0-06 — Auth0 SDK Integration (Frontend)

**Phase:** 0 — Foundation  
**Status:** 🔲 Not started  
**Depends on:** P0-01, P0-05  

---

## Goal

Integrate `@auth0/auth0-react` into the frontend. A test page with Login / Logout buttons confirms the Auth0 flow works end-to-end. The access token is retrieved and logged to verify it can be sent to the backend.

---

## Acceptance Criteria

- [ ] `@auth0/auth0-react` installed
- [ ] `Auth0Provider` wraps the React app root in `main.tsx`
- [ ] Login button triggers the Auth0 Universal Login redirect
- [ ] After login, user is redirected back to the app at `/callback`
- [ ] Logout button clears the session and redirects to `/`
- [ ] `useAuth0()` hook returns `isAuthenticated: true` after login
- [ ] Access token (JWT) is retrievable via `getAccessTokenSilently()`
- [ ] Token is logged to the console in dev mode to confirm it's valid (remove before Phase 1)
- [ ] Protected route wrapper component created (`<ProtectedRoute />`) — redirects to login if unauthenticated

---

## Implementation Notes

```bash
npm install @auth0/auth0-react
```

```tsx
// main.tsx
<Auth0Provider
  domain={import.meta.env.VITE_AUTH0_DOMAIN}
  clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
  authorizationParams={{
    redirect_uri: `${window.location.origin}/callback`,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  }}
>
  <App />
</Auth0Provider>
```

```tsx
// components/ProtectedRoute.tsx
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) { loginWithRedirect(); return null; }
  return <>{children}</>;
};
```

**API call helper** (to be used in later phases):
```ts
// lib/api.ts
export const fetchWithAuth = async (url: string, token: string, options?: RequestInit) =>
  fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
```

---

## Definition of Done

- Login → redirect → return to app → `isAuthenticated: true` → access token retrievable. Logout clears session.
