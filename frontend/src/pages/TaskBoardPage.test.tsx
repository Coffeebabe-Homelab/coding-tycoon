import { Activity } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TaskBoardPage from './TaskBoardPage'
import { authState, jsonResponse, stubApi } from '../test/helpers'
import type { Task } from '../types/task'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

const TASK: Task = {
  id: 7,
  title: 'Add endpoint',
  description: 'Expose the users',
  acceptanceCriteria: 'Returns 200\n\n  Returns JSON  ',
  difficulty: 'Medium',
  tags: ['REST'],
  codebaseKey: 'shopfront',
  focusFiles: ['src/my file.java'],
  status: 'ASSIGNED',
  createdAt: '2026-11-06T10:00:00Z',
}

function renderBoard() {
  render(
    <MemoryRouter initialEntries={['/room/task']}>
      <TaskBoardPage />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

describe('TaskBoardPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it('keeps showing the task while it refreshes after the tab comes back', async () => {
    let answer: () => Promise<Response> = () => Promise.resolve(jsonResponse(TASK))
    stubApi({ 'GET /api/tasks/today': () => answer() })
    const tab = (mode: 'visible' | 'hidden') => (
      <MemoryRouter>
        <Activity mode={mode}>
          <TaskBoardPage />
        </Activity>
      </MemoryRouter>
    )
    const { rerender } = render(tab('visible'))
    await screen.findByRole('heading', { name: 'Add endpoint' })

    answer = () => new Promise(() => {})
    rerender(tab('hidden'))
    rerender(tab('visible'))

    expect(screen.getByRole('heading', { name: 'Add endpoint' })).toBeVisible()
    expect(screen.queryByText("Loading today's task…")).not.toBeInTheDocument()
  })

  it('shows loading, then the task', async () => {
    stubApi({ 'GET /api/tasks/today': TASK })

    renderBoard()
    expect(screen.getByText("Loading today's task…")).toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: 'Add endpoint' })).toBeInTheDocument()
    expect(screen.getByText('Expose the users')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('REST')).toBeInTheDocument()
  })

  it('lists each acceptance criterion, skipping blank lines', async () => {
    stubApi({ 'GET /api/tasks/today': TASK })

    renderBoard()

    const section = await screen.findByRole('region', { name: 'Acceptance Criteria' })
    const items = within(section).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[1]).toHaveTextContent('Returns JSON')
  })

  it('links focus files to the explorer with an encoded path', async () => {
    stubApi({ 'GET /api/tasks/today': TASK })

    renderBoard()

    const link = await screen.findByRole('link', { name: 'src/my file.java' })
    expect(link).toHaveAttribute('href', '/room/codebase?file=src%2Fmy+file.java')
    expect(screen.getByRole('link', { name: /Explore codebase/ })).toHaveAttribute(
      'href',
      '/room/codebase',
    )
  })

  it('shows the error when the task cannot load', async () => {
    stubApi({ 'GET /api/tasks/today': jsonResponse({}, 500) })

    renderBoard()

    expect(await screen.findByText("Failed to load today's task")).toBeInTheDocument()
  })

  it('starts an ASSIGNED task and switches to Continue', async () => {
    stubApi({
      'GET /api/tasks/today': TASK,
      'PATCH /api/tasks/7/status': { ...TASK, status: 'IN_PROGRESS' },
    })
    const user = renderBoard()

    await user.click(await screen.findByRole('button', { name: 'Start task' }))

    expect(await screen.findByRole('button', { name: 'Continue' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Start task' })).not.toBeInTheDocument()
  })

  it('offers no action once the task is past IN_PROGRESS', async () => {
    stubApi({ 'GET /api/tasks/today': { ...TASK, status: 'SUBMITTED' } })

    renderBoard()

    await screen.findByRole('heading', { name: 'Add endpoint' })
    expect(screen.queryByRole('button', { name: 'Start task' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument()
  })
})
