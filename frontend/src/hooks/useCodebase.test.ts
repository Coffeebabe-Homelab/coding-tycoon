import { act, renderHook, waitFor } from '@testing-library/react'
import { useAuth0 } from '@auth0/auth0-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCodebase } from './useCodebase'
import { authState, jsonResponse, stubApi } from '../test/helpers'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const FILES_ROUTE = 'GET /api/codebase/files'
const CODEBASE = {
  codebase: 'shopfront',
  focusFiles: ['src/A.java'],
  files: ['src/A.java', 'b.md'],
}

async function renderLoaded() {
  const { result } = renderHook(() => useCodebase())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  return result
}

/** A route whose response the test releases by hand, to control arrival order. */
function deferredRoute() {
  let release: (response: Response) => void = () => {}
  const route = () =>
    new Promise<Response>((resolve) => {
      release = resolve
    })
  return { route, release: (response: Response) => release(response) }
}

describe('useCodebase', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it('loads the file list', async () => {
    stubApi({ [FILES_ROUTE]: CODEBASE })

    const result = await renderLoaded()

    expect(result.current.files).toEqual(CODEBASE.files)
    expect(result.current.focusFiles).toEqual(CODEBASE.focusFiles)
    expect(result.current.current).toBeNull()
    expect(result.current.noActiveTask).toBe(false)
  })

  it('flags no active task on 404, without an error', async () => {
    stubApi({ [FILES_ROUTE]: jsonResponse({}, 404) })

    const result = await renderLoaded()

    expect(result.current.noActiveTask).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.files).toEqual([])
  })

  it('reports an error on other failures', async () => {
    stubApi({ [FILES_ROUTE]: jsonResponse({}, 500) })

    const result = await renderLoaded()

    expect(result.current.error).toBe('Failed to load the codebase')
    expect(result.current.noActiveTask).toBe(false)
  })

  describe('openFile', () => {
    it('loads the file, encoding each path segment but keeping slashes', async () => {
      const file = { path: 'src/my file.md', content: 'hello' }
      stubApi({
        [FILES_ROUTE]: CODEBASE,
        'GET /api/codebase/files/src/my%20file.md': file,
      })
      const result = await renderLoaded()

      await act(() => result.current.openFile('src/my file.md'))

      expect(result.current.current).toEqual(file)
      expect(result.current.error).toBeNull()
    })

    it('reports which file failed and clears that error on the next open', async () => {
      stubApi({
        [FILES_ROUTE]: CODEBASE,
        'GET /api/codebase/files/b.md': jsonResponse({}, 404),
        'GET /api/codebase/files/src/A.java': { path: 'src/A.java', content: 'class A {}' },
      })
      const result = await renderLoaded()

      await act(() => result.current.openFile('b.md'))
      expect(result.current.error).toBe('Failed to open b.md')

      await act(() => result.current.openFile('src/A.java'))
      expect(result.current.error).toBeNull()
    })

    it('ignores a slow response for a file the player has moved on from', async () => {
      const slow = deferredRoute()
      const fast = { path: 'b.md', content: 'fast' }
      stubApi({
        [FILES_ROUTE]: CODEBASE,
        'GET /api/codebase/files/src/A.java': slow.route,
        'GET /api/codebase/files/b.md': fast,
      })
      const result = await renderLoaded()

      await act(async () => {
        const first = result.current.openFile('src/A.java')
        await result.current.openFile('b.md')
        slow.release(jsonResponse({ path: 'src/A.java', content: 'slow' }))
        await first
      })

      expect(result.current.current).toEqual(fast)
    })

    it('ignores a slow failure for a file the player has moved on from', async () => {
      const slow = deferredRoute()
      stubApi({
        [FILES_ROUTE]: CODEBASE,
        'GET /api/codebase/files/src/A.java': slow.route,
        'GET /api/codebase/files/b.md': { path: 'b.md', content: 'fast' },
      })
      const result = await renderLoaded()

      await act(async () => {
        const first = result.current.openFile('src/A.java')
        await result.current.openFile('b.md')
        slow.release(jsonResponse({}, 500))
        await first
      })

      expect(result.current.error).toBeNull()
    })
  })
})
