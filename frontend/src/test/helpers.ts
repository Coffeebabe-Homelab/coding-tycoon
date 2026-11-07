import { act } from '@testing-library/react'
import type { useAuth0 } from '@auth0/auth0-react'
import { vi } from 'vitest'

export const TEST_TOKEN = 'test-token'

/** A `useAuth0()` result for a logged-in player. Create it once per test: hooks depend on its function identities. */
export function authState(overrides: Record<string, unknown> = {}): ReturnType<typeof useAuth0> {
  return {
    isLoading: false,
    isAuthenticated: true,
    user: { email: 'player@example.com' },
    getAccessTokenSilently: vi.fn().mockResolvedValue(TEST_TOKEN),
    loginWithRedirect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ReturnType<typeof useAuth0>
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

type RouteHandler = () => Response | Promise<Response>

/**
 * Replaces global fetch at the network boundary. Keys are `METHOD /path`.
 * A route is a plain value (sent as 200 JSON), a Response, or a function for anything dynamic.
 * Unknown routes reject, so an unexpected request fails loudly instead of hanging.
 */
export function stubApi(routes: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit): Promise<Response> => {
    const key = `${init?.method ?? 'GET'} ${url.replace('http://api.test', '')}`
    if (!(key in routes)) throw new TypeError(`Unexpected request: ${key}`)
    const route = routes[key]
    if (typeof route === 'function') return (route as RouteHandler)()
    return route instanceof Response ? route.clone() : jsonResponse(route)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Lets pending promises settle, for asserting that something did NOT happen. */
export async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve))
  })
}
