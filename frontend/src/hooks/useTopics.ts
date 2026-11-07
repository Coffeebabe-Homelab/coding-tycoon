import { useEffect, useState } from 'react'
import type { Topic } from '../types/topic'

/**
 * Fetches the list of available topics for the onboarding wizard and profile editor.
 * No auth required — GET /api/topics is a public endpoint.
 *
 * @returns {{ topics: Topic[], isLoading: boolean, error: string | null }}
 */
export function useTopics(): {
  topics: Topic[]
  isLoading: boolean
  error: string | null
} {
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/topics`)
      .then((res) => res.json() as Promise<Topic[]>)
      .then(setTopics)
      .catch(() => setError('Failed to load topics'))
      .finally(() => setIsLoading(false))
  }, [])

  return { topics, isLoading, error }
}
