import { act, renderHook, waitFor } from '@testing-library/react'
import { useAuth0 } from '@auth0/auth0-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTask } from './useTask'
import { authState, jsonResponse, stubApi } from '../test/helpers'
import type { Task } from '../types/task'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const TASK = { id: 7, title: 'Add endpoint', status: 'ASSIGNED' } as Task

async function renderLoaded() {
  const { result } = renderHook(() => useTask())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  return result
}

describe('useTask', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it("loads today's task", async () => {
    stubApi({ 'GET /api/tasks/today': TASK })

    const result = await renderLoaded()

    expect(result.current.task).toEqual(TASK)
    expect(result.current.error).toBeNull()
  })

  it('reports an error when loading fails', async () => {
    stubApi({ 'GET /api/tasks/today': jsonResponse({}, 500) })

    const result = await renderLoaded()

    expect(result.current.task).toBeNull()
    expect(result.current.error).toBe("Failed to load today's task")
  })

  describe('startTask', () => {
    it('moves the task to IN_PROGRESS and shows the updated task', async () => {
      const fetchMock = stubApi({
        'GET /api/tasks/today': TASK,
        'PATCH /api/tasks/7/status': { ...TASK, status: 'IN_PROGRESS' },
      })
      const result = await renderLoaded()

      await act(() => result.current.startTask())

      expect(result.current.task?.status).toBe('IN_PROGRESS')
      expect(fetchMock.mock.calls[1][1]?.body).toBe(JSON.stringify({ status: 'IN_PROGRESS' }))
    })

    it('does nothing when there is no task', async () => {
      const fetchMock = stubApi({ 'GET /api/tasks/today': jsonResponse({}, 404) })
      const result = await renderLoaded()

      await act(() => result.current.startTask())

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('rejects and keeps the current task when the request fails', async () => {
      stubApi({
        'GET /api/tasks/today': TASK,
        'PATCH /api/tasks/7/status': jsonResponse({}, 409),
      })
      const result = await renderLoaded()

      await act(() => expect(result.current.startTask()).rejects.toThrow('API error 409'))

      expect(result.current.task?.status).toBe('ASSIGNED')
    })
  })
})
