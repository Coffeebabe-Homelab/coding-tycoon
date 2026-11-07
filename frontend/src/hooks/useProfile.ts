import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { fetchWithAuth } from '../lib/api'
import type { PlayerProfile } from '../types/profile'

/**
 * Fetches the authenticated player's profile from GET /api/profile.
 * Returns a refetch function so the page can reload after a successful update.
 *
 * @returns {{ profile: PlayerProfile | null, isLoading: boolean, error: string | null, refetch: () => void }}
 */
export function useProfile(): {
  profile: PlayerProfile | null
  isLoading: boolean
  error: string | null
  refetch: () => void
} {
  const { getAccessTokenSilently } = useAuth0()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = () => {
    setIsLoading(true)
    setError(null)
    getAccessTokenSilently()
      .then((token) => fetchWithAuth<PlayerProfile>('/api/profile', token))
      .then(setProfile)
      .catch(() => setError('Failed to load profile'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { profile, isLoading, error, refetch: fetchProfile }
}
