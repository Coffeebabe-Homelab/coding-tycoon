const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

/**
 * Fetch wrapper that injects the Auth0 Bearer token into every request.
 * Always use this instead of raw fetch for authenticated API calls.
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
    throw new Error(`API error ${res.status}: ${await res.text()}`)
  }

  return res.json() as Promise<T>
}
