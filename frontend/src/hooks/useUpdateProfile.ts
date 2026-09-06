import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { fetchWithAuth } from '../lib/api'

/** Payload for updating an existing player profile. */
export interface UpdateProfilePayload {
  language: string
  framework: string
  seniority: string
  /** Topic IDs — backend resolves these to full Topic objects. */
  topicIds: number[]
}

/**
 * Hook for saving changes to the player's profile via PUT /api/profile.
 *
 * @returns {{ updateProfile: (payload: UpdateProfilePayload) => Promise<boolean>, isLoading: boolean, error: string | null }}
 */
export function useUpdateProfile(): {
  updateProfile: (payload: UpdateProfilePayload) => Promise<boolean>
  isLoading: boolean
  error: string | null
} {
  const { getAccessTokenSilently } = useAuth0()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProfile = async (payload: UpdateProfilePayload): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getAccessTokenSilently()
      await fetchWithAuth('/api/profile', token, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      return true
    } catch {
      setError('Failed to save changes. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { updateProfile, isLoading, error }
}
