const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

/** Non-2xx API response; `status` lets callers react to specific codes (e.g. 404 → onboarding). */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, body: string) {
    super(`API error ${status}: ${body}`)
    this.status = status
  }
}

/**
 * Fetch wrapper that injects the Auth0 Bearer token into every request.
 * Always use this instead of raw fetch for authenticated API calls.
 *
 * Resolves to `undefined` on 204 No Content, so `T` should include `undefined` for such endpoints.
 *
 * @throws ApiError when the response status is not 2xx, or with status 401 when there is no token
 */
export const fetchWithAuth = async <T>(
  path: string,
  token: string | undefined,
  options?: RequestInit,
): Promise<T> => {
  // Auth0's getAccessTokenSilently() can resolve to undefined; never send "Bearer undefined".
  if (!token) throw new ApiError(401, 'No access token')

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new ApiError(res.status, await res.text())
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/** Encodes each segment of a codebase path but keeps the slashes the backend route expects. */
export function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}
