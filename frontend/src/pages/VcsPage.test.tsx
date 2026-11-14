import { Activity, type ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VcsPage from './VcsPage'
import { DraftsProvider, useDrafts } from '../hooks/useDrafts'
import { ToastProvider } from '../hooks/useToast'
import { authState, jsonResponse, stubApi } from '../test/helpers'
import type { CodeDiffProps } from '../components/CodeEditor'
import type { Task } from '../types/task'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

// Monaco can't run in jsdom: the stub shows what would be compared and reports line counts.
vi.mock('../components/DiffView', () => ({
  DiffView: ({ original, modified, split, ariaLabel, onLineCounts }: CodeDiffProps) => (
    <div role="region" aria-label={ariaLabel}>
      <p>{`${original} -> ${modified}`}</p>
      <p>{split ? 'split view' : 'unified view'}</p>
      <button onClick={() => onLineCounts?.(15, 1)}>diff ready</button>
    </div>
  ),
}))

const CONTROLLER = 'src/main/java/com/shopfront/user/UserController.java'
const SERVICE = 'src/main/java/com/shopfront/user/UserService.java'
const TASK: Task = {
  id: 12,
  title: 'List the users!',
  description: 'Add GET /api/users',
  acceptanceCriteria: 'Returns 200',
  difficulty: 'Easy',
  tags: [],
  codebaseKey: 'shopfront',
  focusFiles: [CONTROLLER, SERVICE],
  status: 'IN_PROGRESS',
  createdAt: '2026-11-14T10:00:00Z',
}
const PUSHED = {
  id: 3,
  taskId: 12,
  attemptNumber: 1,
  commitHash: 'e234bb7',
  commitMessage: 'feat(users): list users',
  submittedAt: '2026-11-14T14:02:00Z',
  files: [{ path: CONTROLLER, content: 'pushed controller' }],
}
const NO_PUSH = new Response(null, { status: 204 })

function routes(task: Partial<Task> = {}, latest: unknown = NO_PUSH, extra = {}) {
  return {
    'GET /api/tasks/today': { ...TASK, ...task },
    [`GET /api/codebase/files/${CONTROLLER}`]: { path: CONTROLLER, content: 'controller' },
    [`GET /api/codebase/files/${SERVICE}`]: { path: SERVICE, content: 'service' },
    'GET /api/submissions/latest': latest,
    ...extra,
  }
}

/** Edits drafts the way the Editor tab would, through the shared provider. */
function EditorStandIn() {
  const { files, setDraft } = useDrafts()
  if (files.length === 0) return null
  return (
    <>
      <button onClick={() => setDraft(CONTROLLER, 'edited controller')}>edit controller</button>
      <button onClick={() => setDraft(SERVICE, 'edited service')}>edit service</button>
    </>
  )
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <DraftsProvider>
        <ToastProvider>{children}</ToastProvider>
      </DraftsProvider>
    </MemoryRouter>
  )
}

function page(mode: 'visible' | 'hidden' = 'visible') {
  return (
    <>
      <EditorStandIn />
      <Activity mode={mode}>
        <VcsPage />
      </Activity>
    </>
  )
}

function renderVcs() {
  const result = render(page(), { wrapper: Providers })
  return { user: userEvent.setup(), rerender: result.rerender }
}

async function editBoth(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'edit controller' }))
  await user.click(screen.getByRole('button', { name: 'edit service' }))
}

const pushButton = () => screen.getByRole('button', { name: 'Commit & push for review' })
const message = () => screen.getByRole('textbox', { name: 'Commit message' })

describe('VcsPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it('points to the Editor while nothing has changed', async () => {
    stubApi(routes())
    renderVcs()

    expect(await screen.findByText(/No changes yet/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the editor' })).toHaveAttribute(
      'href',
      '/room/editor',
    )
  })

  it('lists the changed files on a branch named after the task', async () => {
    stubApi(routes())
    const { user } = renderVcs()
    await editBoth(user)

    expect(screen.getByText('feat/task-12-list-the-users')).toBeInTheDocument()
    expect(screen.getByText('Changes · 2')).toBeInTheDocument()
    const changes = screen.getByRole('list', { name: 'Changed files' })
    expect(
      within(changes)
        .getAllByRole('button')
        .map((row) => row.textContent),
    ).toEqual(['UserController.javaM', 'UserService.javaM'])
  })

  it('shows the selected file as a diff with its line counts, and opens it in the Editor', async () => {
    stubApi(routes())
    const { user } = renderVcs()
    await editBoth(user)

    expect(screen.getByText('controller -> edited controller')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /UserService\.java/ }))
    expect(screen.getByText('service -> edited service')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /UserService\.java/ })).toHaveAttribute(
      'aria-current',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'diff ready' }))
    expect(screen.getByText('+15')).toBeInTheDocument()
    expect(screen.getByText('−1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open in editor' })).toHaveAttribute(
      'href',
      `/room/editor?file=${encodeURIComponent(SERVICE)}`,
    )
  })

  it('switches between unified and split', async () => {
    stubApi(routes())
    const { user } = renderVcs()
    await editBoth(user)
    expect(screen.getByText('unified view')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unified' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Split' }))

    expect(screen.getByText('split view')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Split' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('needs a commit message to push, and counts it against 72', async () => {
    stubApi(routes())
    const { user } = renderVcs()
    await editBoth(user)
    expect(pushButton()).toBeDisabled()

    await user.type(message(), '   ')
    expect(pushButton()).toBeDisabled()
    await user.clear(message())
    await user.type(message(), 'feat: x')

    expect(pushButton()).toBeEnabled()
    expect(message()).toHaveAccessibleDescription('Conventional commit · 7 / 72')
    expect(message()).toHaveAttribute('maxlength', '72')
    expect(screen.getByText(/2 files · attempt 1/)).toBeInTheDocument()
  })

  it('asks first, then pushes the changed files and shows the pushed state with a toast', async () => {
    const fetchMock = stubApi(
      routes({}, NO_PUSH, {
        'POST /api/submissions': jsonResponse(
          { ...PUSHED, files: [{ path: CONTROLLER, content: 'edited controller' }] },
          201,
        ),
      }),
    )
    const { user } = renderVcs()
    await user.click(await screen.findByRole('button', { name: 'edit controller' }))
    await user.type(message(), '  feat(users): list users ')

    await user.click(pushButton())
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/submissions'),
      expect.objectContaining({ method: 'POST' }),
    )

    await user.click(pushButton())
    expect(screen.getByRole('alertdialog', { name: 'Push to review?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Push' }))

    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!
    expect(JSON.parse(post[1]!.body as string)).toEqual({
      commitMessage: 'feat(users): list users',
      files: [{ path: CONTROLLER, content: 'edited controller' }],
    })
    expect(
      await screen.findByRole('button', { name: 'Pushed · waiting for review' }),
    ).toBeDisabled()
    expect(screen.getByText('Last push · e234bb7')).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(/waiting for review/)
    expect(screen.queryByText(/reviewing/i)).not.toBeInTheDocument()
  })

  it('shows the last push after a reload while the task is submitted', async () => {
    stubApi(routes({ status: 'SUBMITTED' }, PUSHED))
    renderVcs()

    expect(await screen.findByText('Last push · e234bb7')).toBeInTheDocument()
    expect(screen.getByText('Pushed · e234bb7')).toBeInTheDocument()
    expect(message()).toHaveValue('feat(users): list users')
    expect(message()).toBeDisabled()
    expect(message()).toHaveAccessibleDescription('Committed as e234bb7')
    expect(screen.getByText('controller -> pushed controller')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pushed · waiting for review' })).toBeDisabled()
    expect(screen.getByText(/Attempt 1 submitted at/)).toBeInTheDocument()
  })

  it('keeps the drafts and the message when a push fails, and says why', async () => {
    stubApi(
      routes({}, NO_PUSH, {
        'POST /api/submissions': jsonResponse(
          { error: 'x', message: 'Task is SUBMITTED: start it before pushing', status: 422 },
          422,
        ),
      }),
    )
    const { user } = renderVcs()
    await editBoth(user)
    await user.type(message(), 'feat: x')

    await user.click(pushButton())
    await user.click(screen.getByRole('button', { name: 'Push' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Task is SUBMITTED: start it before pushing',
    )
    expect(message()).toHaveValue('feat: x')
    expect(screen.getByText('Changes · 2')).toBeInTheDocument()
    expect(pushButton()).toBeEnabled()
  })

  it('keeps the message across a tab switch', async () => {
    stubApi(routes())
    const { user, rerender } = renderVcs()
    await editBoth(user)
    await user.type(message(), 'feat: x')

    rerender(page('hidden'))
    rerender(page('visible'))

    await waitFor(() => expect(message()).toHaveValue('feat: x'))
  })

  it('asks to start an assigned task first', async () => {
    stubApi(routes({ status: 'ASSIGNED' }))
    renderVcs()

    expect(await screen.findByText(/Start the task/)).toBeInTheDocument()
  })

  it('points to the codebase when the task has no files', async () => {
    stubApi(routes({ focusFiles: [] }))
    renderVcs()

    expect(await screen.findByText(/no files to change/)).toBeInTheDocument()
  })

  it('shows a load error', async () => {
    stubApi(routes({}, jsonResponse({}, 500)))
    renderVcs()

    expect(await screen.findByText('Failed to load your last push')).toBeInTheDocument()
  })
})
