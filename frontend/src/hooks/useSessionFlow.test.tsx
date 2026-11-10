import type { ReactNode } from 'react'
import { render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionFlow } from './useSessionFlow'
import { authState, jsonResponse, settle, stubApi } from '../test/helpers'
import { LocationProbe } from '../test/LocationProbe'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const PROFILE = { id: 1 }

function enterAt(path: string) {
  return renderHook(() => useSessionFlow(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[path]}>
        <LocationProbe />
        {children}
      </MemoryRouter>
    ),
  })
}

function SessionFlow() {
  useSessionFlow()
  return null
}

const location = () => screen.getByTestId('location')

describe('useSessionFlow', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends a player with no profile (404) to onboarding', async () => {
    stubApi({ 'GET /api/profile': jsonResponse({}, 404) })

    enterAt('/room')

    await waitFor(() => expect(location()).toHaveTextContent('/onboarding'))
  })

  it('sends a player with no profile to onboarding from a deep link too', async () => {
    stubApi({ 'GET /api/profile': jsonResponse({}, 404) })

    enterAt('/profile')

    await waitFor(() => expect(location()).toHaveTextContent('/onboarding'))
  })

  it.each([401, 500])('stays in the room when the profile request answers %i', async (status) => {
    stubApi({ 'GET /api/profile': jsonResponse({}, status) })

    enterAt('/room')
    await settle()

    expect(location()).toHaveTextContent(/^\/room$/)
  })

  it('stays in the room when the network fails', async () => {
    stubApi({ 'GET /api/profile': () => Promise.reject(new TypeError('Failed to fetch')) })

    enterAt('/room')
    await settle()

    expect(location()).toHaveTextContent(/^\/room$/)
  })

  it('stays in the room when no token can be obtained', async () => {
    const fetchMock = stubApi({})
    vi.mocked(useAuth0).mockReturnValue(
      authState({ getAccessTokenSilently: vi.fn().mockRejectedValue(new Error('login_required')) }),
    )

    enterAt('/room')
    await settle()

    expect(location()).toHaveTextContent(/^\/room$/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("opens the Task Board when today's task is still ASSIGNED", async () => {
    stubApi({ 'GET /api/profile': PROFILE, 'GET /api/tasks/today': { status: 'ASSIGNED' } })

    enterAt('/room')

    await waitFor(() => expect(location()).toHaveTextContent('/room/task'))
  })

  it('opens the Task Board only once per browser session', async () => {
    const fetchMock = stubApi({
      'GET /api/profile': PROFILE,
      'GET /api/tasks/today': { status: 'ASSIGNED' },
    })
    const first = enterAt('/room')
    await waitFor(() => expect(location()).toHaveTextContent('/room/task'))
    first.unmount()

    enterAt('/room')
    await settle()

    expect(location()).toHaveTextContent(/^\/room$/)
    const taskRequests = fetchMock.mock.calls.filter(([url]) => url.endsWith('/api/tasks/today'))
    expect(taskRequests).toHaveLength(1)
  })

  it('stays in the room when the task has already started', async () => {
    stubApi({ 'GET /api/profile': PROFILE, 'GET /api/tasks/today': { status: 'IN_PROGRESS' } })

    enterAt('/room')
    await settle()

    expect(location()).toHaveTextContent(/^\/room$/)
  })

  it('stays in the room when there is no task today', async () => {
    stubApi({ 'GET /api/profile': PROFILE, 'GET /api/tasks/today': jsonResponse({}, 404) })

    enterAt('/room')
    await settle()

    expect(location()).toHaveTextContent(/^\/room$/)
  })

  it('checks the profile once, however often the route changes', async () => {
    function MoveAround() {
      const navigate = useNavigate()
      return <button onClick={() => navigate('/room/codebase')}>move</button>
    }
    const fetchMock = stubApi({
      'GET /api/profile': PROFILE,
      'GET /api/tasks/today': { status: 'IN_PROGRESS' },
    })
    render(
      <MemoryRouter initialEntries={['/room']}>
        <SessionFlow />
        <MoveAround />
      </MemoryRouter>,
    )
    await settle()

    await userEvent.click(screen.getByRole('button', { name: 'move' }))
    await settle()

    const profileRequests = fetchMock.mock.calls.filter(([url]) => url.endsWith('/api/profile'))
    expect(profileRequests).toHaveLength(1)
  })

  it('never redirects a deep link to a panel', async () => {
    const fetchMock = stubApi({ 'GET /api/profile': PROFILE })

    enterAt('/profile')
    await settle()

    expect(location()).toHaveTextContent('/profile')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not navigate after leaving the room', async () => {
    let release: (response: Response) => void = () => {}
    stubApi({
      'GET /api/profile': () =>
        new Promise<Response>((resolve) => {
          release = resolve
        }),
    })
    // The router outlives the flow, so a late navigate would still move the probe.
    const room = (inRoom: boolean) => (
      <MemoryRouter initialEntries={['/room']}>
        <LocationProbe />
        {inRoom && <SessionFlow />}
      </MemoryRouter>
    )
    const { rerender } = render(room(true))
    await settle()

    rerender(room(false))
    release(jsonResponse({}, 404))
    await settle()

    expect(location()).toHaveTextContent(/^\/room$/)
  })

  it('still works when sessionStorage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    stubApi({ 'GET /api/profile': PROFILE, 'GET /api/tasks/today': { status: 'ASSIGNED' } })

    enterAt('/room')

    await waitFor(() => expect(location()).toHaveTextContent('/room/task'))
  })
})
