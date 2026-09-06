import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import { fetchWithAuth } from '../lib/api'

/** Payload for creating a new player profile. */
export interface CreateProfilePayload {
  language: string
  framework: string
  seniority: string
  /** Topic IDs — backend resolves these to full Topic objects. */
  topicIds: number[]
}

/**
 * Hook for submitting a new player profile on first login.
 * On success, navigates to /room.
 *
 * @returns {{ createProfile: (payload: CreateProfilePayload) => Promise<void>, isLoading: boolean, error: string | null }}
 */
export function useCreateProfile(): {
  createProfile: (payload: CreateProfilePayload) => Promise<void>
  isLoading: boolean
  error: string | null
} {
  const { getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProfile = async (payload: CreateProfilePayload) => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getAccessTokenSilently()
      await fetchWithAuth('/api/profile', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      navigate('/room')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return { createProfile, isLoading, error }
}
