import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAuth0 } from '@auth0/auth0-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DraftsProvider, useDrafts } from './useDrafts'
import { authState, jsonResponse, stubApi } from '../test/helpers'
import type { Task } from '../types/task'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const A = 'src/A.java'
const B = 'src/B.java'
const TASK = { id: 7, focusFiles: [A, B], status: 'IN_PROGRESS' } as Task
const NO_PUSH = new Response(null, { status: 204 })

function routes(latest: unknown = NO_PUSH) {
  return {
    [`GET /api/codebase/files/src/A.java`]: { path: A, content: 'a' },
    [`GET /api/codebase/files/src/B.java`]: { path: B, content: 'b' },
    'GET /api/submissions/latest': latest,
  }
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <DraftsProvider>{children}</DraftsProvider>
)

async function renderLoaded(task: Task = TASK) {
  const { result } = renderHook(() => useDrafts(), { wrapper })
  act(() => result.current.loadDrafts(task))
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  return result
}

describe('useDrafts', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it('starts each focus file from the codebase original', async () => {
    stubApi(routes())

    const result = await renderLoaded()

    expect(result.current.files).toEqual([
      { path: A, original: 'a', draft: 'a' },
      { path: B, original: 'b', draft: 'b' },
    ])
    expect(result.current.changedPaths).toEqual([])
  })

  it('starts pushed files from the latest submission', async () => {
    stubApi(routes({ taskId: 7, files: [{ path: B, content: 'pushed b' }] }))

    const result = await renderLoaded()

    expect(result.current.files[1]).toEqual({ path: B, original: 'b', draft: 'pushed b' })
    expect(result.current.changedPaths).toEqual([B])
  })

  it('ignores a submission of another task', async () => {
    stubApi(routes({ taskId: 99, files: [{ path: A, content: 'old' }] }))

    const result = await renderLoaded()

    expect(result.current.files[0].draft).toBe('a')
  })

  it('edits and resets one file', async () => {
    stubApi(routes())
    const result = await renderLoaded()

    act(() => result.current.setDraft(A, 'edited'))
    expect(result.current.files[0].draft).toBe('edited')
    expect(result.current.changedPaths).toEqual([A])

    act(() => result.current.resetFile(A))
    expect(result.current.files[0].draft).toBe('a')
  })

  it('keeps the drafts when the same task loads again', async () => {
    const fetchMock = stubApi(routes())
    const result = await renderLoaded()
    act(() => result.current.setDraft(A, 'edited'))

    act(() => result.current.loadDrafts(TASK))

    expect(result.current.files[0].draft).toBe('edited')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('starts over for a different task', async () => {
    stubApi({
      ...routes(),
      'GET /api/codebase/files/src/C.java': { path: 'src/C.java', content: 'c' },
    })
    const result = await renderLoaded()

    act(() => result.current.loadDrafts({ ...TASK, id: 8, focusFiles: ['src/C.java'] }))
    await waitFor(() =>
      expect(result.current.files.map((file) => file.path)).toEqual(['src/C.java']),
    )
  })

  it('reports a failed load and retries on the next call', async () => {
    stubApi({ ...routes(), 'GET /api/codebase/files/src/B.java': jsonResponse({}, 500) })
    const result = await renderLoaded()

    expect(result.current.error).toBe('Failed to load the task files')
    expect(result.current.files).toEqual([])

    stubApi(routes())
    act(() => result.current.loadDrafts(TASK))
    await waitFor(() => expect(result.current.files).toHaveLength(2))
    expect(result.current.error).toBeNull()
  })

  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useDrafts())).toThrow('DraftsProvider')
  })
})
