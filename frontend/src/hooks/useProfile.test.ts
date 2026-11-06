import { act, renderHook, waitFor } from '@testing-library/react'
import { useAuth0 } from '@auth0/auth0-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfile } from './useProfile'
import { useUpdateProfile } from './useUpdateProfile'
import { authState, jsonResponse, stubApi } from '../test/helpers'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const PROFILE = { id: 1, language: 'Java', framework: 'Spring Boot', seniority: 'Mid', topics: [] }
const PAYLOAD = { language: 'Java', framework: 'Spring Boot', seniority: 'Mid', topicIds: [1] }

describe('profile hooks', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  describe('useProfile', () => {
    it('loads the profile', async () => {
      stubApi({ 'GET /api/profile': PROFILE })

      const { result } = renderHook(() => useProfile())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.profile).toEqual(PROFILE)
      expect(result.current.error).toBeNull()
    })

    it('reports an error when loading fails', async () => {
      stubApi({ 'GET /api/profile': jsonResponse({}, 500) })

      const { result } = renderHook(() => useProfile())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.profile).toBeNull()
      expect(result.current.error).toBe('Failed to load profile')
    })

    it('reloads on refetch', async () => {
      stubApi({ 'GET /api/profile': PROFILE })
      const { result } = renderHook(() => useProfile())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      stubApi({ 'GET /api/profile': { ...PROFILE, seniority: 'Senior' } })
      act(() => result.current.refetch())

      await waitFor(() => expect(result.current.profile?.seniority).toBe('Senior'))
    })
  })

  describe('useUpdateProfile', () => {
    it('puts the changes and reports success', async () => {
      const fetchMock = stubApi({ 'PUT /api/profile': PROFILE })
      const { result } = renderHook(() => useUpdateProfile())

      let saved: boolean | undefined
      await act(async () => {
        saved = await result.current.updateProfile(PAYLOAD)
      })

      expect(saved).toBe(true)
      expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify(PAYLOAD))
      expect(result.current.error).toBeNull()
    })

    it('reports failure and an error message', async () => {
      stubApi({ 'PUT /api/profile': jsonResponse({}, 500) })
      const { result } = renderHook(() => useUpdateProfile())

      let saved: boolean | undefined
      await act(async () => {
        saved = await result.current.updateProfile(PAYLOAD)
      })

      expect(saved).toBe(false)
      expect(result.current.error).toBe('Failed to save changes. Please try again.')
      expect(result.current.isLoading).toBe(false)
    })
  })
})
