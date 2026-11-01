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
 * @throws ApiError when the response status is not 2xx
 */
export const fetchWithAuth = async <T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> => {
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

  return res.json() as Promise<T>
}
