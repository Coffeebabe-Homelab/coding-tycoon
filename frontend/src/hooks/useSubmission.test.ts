import { act, renderHook, waitFor } from '@testing-library/react'
import { useAuth0 } from '@auth0/auth0-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSubmission } from './useSubmission'
import { authState, jsonResponse, stubApi } from '../test/helpers'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const PUSHED = {
  id: 3,
  taskId: 7,
  attemptNumber: 1,
  commitHash: 'e234bb7',
  commitMessage: 'feat: list users',
  submittedAt: '2026-11-14T14:02:00Z',
  files: [{ path: 'src/A.java', content: 'changed' }],
}

async function renderLoaded() {
  const { result } = renderHook(() => useSubmission())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  return result
}

describe('useSubmission', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it('loads the latest push', async () => {
    stubApi({ 'GET /api/submissions/latest': PUSHED })

    expect((await renderLoaded()).current.latest).toEqual(PUSHED)
  })

  it('has no latest push on 204', async () => {
    stubApi({ 'GET /api/submissions/latest': new Response(null, { status: 204 }) })

    expect((await renderLoaded()).current.latest).toBeNull()
  })

  it('pushes the message and files, and keeps the result as the latest push', async () => {
    const fetchMock = stubApi({
      'GET /api/submissions/latest': new Response(null, { status: 204 }),
      'POST /api/submissions': jsonResponse(PUSHED, 201),
    })
    const result = await renderLoaded()

    await act(() =>
      result.current.push('feat: list users', [{ path: 'src/A.java', content: 'changed' }]),
    )

    expect(result.current.latest).toEqual(PUSHED)
    expect(result.current.pushError).toBeNull()
    const [, init] = fetchMock.mock.calls[1]
    expect(JSON.parse(init!.body as string)).toEqual({
      commitMessage: 'feat: list users',
      files: [{ path: 'src/A.java', content: 'changed' }],
    })
  })

  it("keeps the server's reason when a push is rejected", async () => {
    stubApi({
      'GET /api/submissions/latest': new Response(null, { status: 204 }),
      'POST /api/submissions': jsonResponse(
        { error: 'x', message: 'src/A.java is unchanged', status: 422 },
        422,
      ),
    })
    const result = await renderLoaded()

    await act(() => result.current.push('feat: x', []))

    expect(result.current.pushError).toBe('src/A.java is unchanged')
    expect(result.current.latest).toBeNull()
  })

  it('falls back to a generic message when the push fails without one', async () => {
    stubApi({
      'GET /api/submissions/latest': new Response(null, { status: 204 }),
      'POST /api/submissions': () => Promise.reject(new TypeError('offline')),
    })
    const result = await renderLoaded()

    await act(() => result.current.push('feat: x', []))

    expect(result.current.pushError).toBe('Push failed. Check your connection and try again.')
  })

  it('reports a failed load', async () => {
    stubApi({ 'GET /api/submissions/latest': jsonResponse({}, 500) })

    expect((await renderLoaded()).current.loadError).toBe('Failed to load your last push')
  })
})
