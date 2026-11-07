import { renderHook, waitFor } from '@testing-library/react'
import { useAuth0 } from '@auth0/auth0-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from './useProgress'
import { authState, jsonResponse, settle, stubApi } from '../test/helpers'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const PROGRESS = {
  totalXp: 100,
  xpToday: 0,
  currentStreak: 1,
  longestStreak: 2,
  approvedTodayTaskTitle: null,
}

describe('useProgress', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it('loads the progress', async () => {
    stubApi({ 'GET /api/progress': PROGRESS })

    const { result } = renderHook(() => useProgress())
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.progress).toEqual(PROGRESS)
    expect(result.current.error).toBeNull()
  })

  it('reports an error when loading fails', async () => {
    stubApi({ 'GET /api/progress': jsonResponse({}, 500) })

    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.progress).toBeNull()
    expect(result.current.error).toBe('Failed to load progress')
  })

  it('refetches when refreshKey changes, showing the old values until the new ones arrive', async () => {
    let release: (response: Response) => void = () => {}
    stubApi({ 'GET /api/progress': PROGRESS })
    const { result, rerender } = renderHook(({ key }) => useProgress(key), {
      initialProps: { key: false },
    })
    await waitFor(() => expect(result.current.progress?.totalXp).toBe(100))

    stubApi({
      'GET /api/progress': () =>
        new Promise<Response>((resolve) => {
          release = resolve
        }),
    })
    rerender({ key: true })
    await settle()
    expect(result.current.progress?.totalXp).toBe(100)
    expect(result.current.isLoading).toBe(false)

    release(jsonResponse({ ...PROGRESS, totalXp: 200 }))
    await waitFor(() => expect(result.current.progress?.totalXp).toBe(200))
  })

  it('does not refetch when refreshKey stays the same', async () => {
    const fetchMock = stubApi({ 'GET /api/progress': PROGRESS })
    const { result, rerender } = renderHook(({ key }) => useProgress(key), {
      initialProps: { key: false },
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    rerender({ key: false })
    await settle()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('clears an earlier error once a refetch succeeds', async () => {
    stubApi({ 'GET /api/progress': jsonResponse({}, 500) })
    const { result, rerender } = renderHook(({ key }) => useProgress(key), {
      initialProps: { key: false },
    })
    await waitFor(() => expect(result.current.error).not.toBeNull())

    stubApi({ 'GET /api/progress': PROGRESS })
    rerender({ key: true })

    await waitFor(() => expect(result.current.progress).toEqual(PROGRESS))
    expect(result.current.error).toBeNull()
  })

  it('ignores a response that arrives after a newer request started', async () => {
    let releaseFirst: (response: Response) => void = () => {}
    stubApi({
      'GET /api/progress': () =>
        new Promise<Response>((resolve) => {
          releaseFirst = resolve
        }),
    })
    const { result, rerender } = renderHook(({ key }) => useProgress(key), {
      initialProps: { key: false },
    })
    await settle()

    stubApi({ 'GET /api/progress': { ...PROGRESS, totalXp: 200 } })
    rerender({ key: true })
    await waitFor(() => expect(result.current.progress?.totalXp).toBe(200))

    releaseFirst(jsonResponse({ ...PROGRESS, totalXp: 1 }))
    await settle()

    expect(result.current.progress?.totalXp).toBe(200)
  })
})
