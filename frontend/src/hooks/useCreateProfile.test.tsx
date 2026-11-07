import type { ReactNode } from 'react'
import { act, renderHook, screen } from '@testing-library/react'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreateProfile } from './useCreateProfile'
import { authState, jsonResponse, stubApi } from '../test/helpers'
import { LocationProbe } from '../test/LocationProbe'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const PAYLOAD = { language: 'Java', framework: 'Spring Boot', seniority: 'Mid', topicIds: [1, 2] }

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/onboarding']}>
      <LocationProbe />
      {children}
    </MemoryRouter>
  )
}

describe('useCreateProfile', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it('posts the profile and goes to the room', async () => {
    const fetchMock = stubApi({ 'POST /api/profile': { id: 1 } })
    const { result } = renderHook(() => useCreateProfile(), { wrapper })

    await act(() => result.current.createProfile(PAYLOAD))

    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify(PAYLOAD))
    expect(screen.getByTestId('location')).toHaveTextContent('/room')
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('shows an error and stays put when saving fails', async () => {
    stubApi({ 'POST /api/profile': jsonResponse({}, 500) })
    const { result } = renderHook(() => useCreateProfile(), { wrapper })

    await act(() => result.current.createProfile(PAYLOAD))

    expect(result.current.error).toBe('Something went wrong. Please try again.')
    expect(result.current.isLoading).toBe(false)
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding')
  })

  it('clears the previous error when retrying', async () => {
    stubApi({ 'POST /api/profile': jsonResponse({}, 500) })
    const { result } = renderHook(() => useCreateProfile(), { wrapper })
    await act(() => result.current.createProfile(PAYLOAD))

    stubApi({ 'POST /api/profile': { id: 1 } })
    await act(() => result.current.createProfile(PAYLOAD))

    expect(result.current.error).toBeNull()
  })
})
