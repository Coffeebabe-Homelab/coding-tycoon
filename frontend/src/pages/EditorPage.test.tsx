import { Activity } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EditorPage from './EditorPage'
import { DraftsProvider } from '../hooks/useDrafts'
import { authState, stubApi } from '../test/helpers'
import type { CodeEditorProps } from '../components/CodeEditor'
import type { Task } from '../types/task'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

// Monaco can't run in jsdom: a textarea stands in, keyed by model path like Monaco's models.
vi.mock('../components/LazyCodeEditor', () => ({
  LazyCodeEditor: ({
    value,
    readOnly,
    onChange,
    onCursorChange,
    ariaLabel,
    path,
  }: CodeEditorProps) => (
    <div className="monaco-editor">
      <textarea
        aria-label={ariaLabel}
        data-path={path}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
      <button onClick={() => onCursorChange?.(4, 2)}>move cursor</button>
    </div>
  ),
}))

const CONTROLLER = 'src/main/java/com/shopfront/user/UserController.java'
const SERVICE = 'src/main/java/com/shopfront/user/UserService.java'
const TASK: Task = {
  id: 7,
  title: 'List the users',
  description: 'Add GET /api/users',
  acceptanceCriteria: 'Returns 200\nReturns JSON',
  difficulty: 'Easy',
  tags: [],
  codebaseKey: 'shopfront',
  focusFiles: [CONTROLLER, SERVICE],
  status: 'IN_PROGRESS',
  createdAt: '2026-11-14T10:00:00Z',
}
const NO_PUSH = new Response(null, { status: 204 })

function stubTask(task: Partial<Task> = {}, latest: unknown = NO_PUSH) {
  stubApi({
    'GET /api/tasks/today': { ...TASK, ...task },
    [`GET /api/codebase/files/${CONTROLLER}`]: {
      path: CONTROLLER,
      content: 'class UserController {}',
    },
    [`GET /api/codebase/files/${SERVICE}`]: { path: SERVICE, content: 'class UserService {}' },
    'GET /api/submissions/latest': latest,
  })
}

function page(mode: 'visible' | 'hidden' = 'visible') {
  return (
    <Activity mode={mode}>
      <EditorPage />
    </Activity>
  )
}

function renderEditor() {
  const result = render(page(), {
    wrapper: ({ children }) => (
      <MemoryRouter>
        <DraftsProvider>{children}</DraftsProvider>
      </MemoryRouter>
    ),
  })
  return { user: userEvent.setup(), rerender: result.rerender }
}

const editor = (name = 'UserController.java') =>
  screen.findByRole('textbox', { name: `Editing ${name}` })
const fileTab = (name: string) => screen.getByRole('tab', { name: new RegExp(`^${name}`) })

describe('EditorPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it('shows the ticket with its criteria as a read-only list', async () => {
    stubTask()
    renderEditor()

    expect(await screen.findByRole('heading', { name: 'List the users' })).toBeInTheDocument()
    const criteria = screen.getByRole('list', { name: 'Acceptance criteria' })
    expect(
      within(criteria)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Returns 200', 'Returns JSON'])
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('opens the first focus file in its own model, with a path breadcrumb', async () => {
    stubTask()
    renderEditor()

    expect(await editor()).toHaveValue('class UserController {}')
    expect(await editor()).toHaveAttribute('data-path', `draft/${CONTROLLER}`)
    expect(fileTab('UserController.java')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('File path')).toHaveTextContent(
      'src › main › java › com › shopfront › user › UserController.java',
    )
  })

  it('switches files from the tabs and with the arrow keys', async () => {
    stubTask()
    const { user } = renderEditor()
    await editor()

    await user.click(fileTab('UserService.java'))
    expect(await editor('UserService.java')).toHaveValue('class UserService {}')

    await user.keyboard('{ArrowLeft}')
    expect(fileTab('UserController.java')).toHaveFocus()
    expect(await editor()).toBeInTheDocument()
    await user.keyboard('{End}')
    expect(fileTab('UserService.java')).toHaveFocus()
    await user.keyboard('{Home}')
    expect(fileTab('UserController.java')).toHaveFocus()
  })

  it('keeps each draft across file and panel tab switches', async () => {
    stubTask()
    const { user, rerender } = renderEditor()
    await user.type(await editor(), ' // edited')
    await user.click(fileTab('UserService.java'))
    await user.click(fileTab('UserController.java'))

    rerender(page('hidden'))
    rerender(page('visible'))

    expect(await editor()).toHaveValue('class UserController {} // edited')
    expect(screen.getByText('1 file changed')).toBeInTheDocument()
  })

  it('starts from the latest push', async () => {
    stubTask({}, { taskId: 7, files: [{ path: CONTROLLER, content: 'pushed' }] })
    renderEditor()

    expect(await editor()).toHaveValue('pushed')
  })

  it('resets a file only after confirming, then focuses its tab', async () => {
    stubTask()
    const { user } = renderEditor()
    const reset = () => screen.getByRole('button', { name: 'Reset file' })
    await editor()
    expect(reset()).toBeDisabled()
    await user.type(await editor(), '!')

    await user.click(reset())
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await editor()).toHaveValue('class UserController {}!')

    await user.click(reset())
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(await editor()).toHaveValue('class UserController {}')
    expect(fileTab('UserController.java')).toHaveFocus()
  })

  it('offers Review changes only once something changed', async () => {
    stubTask()
    const { user } = renderEditor()
    await editor()
    expect(screen.getByRole('button', { name: 'Review changes' })).toBeDisabled()

    await user.type(await editor(), '!')

    expect(screen.getByRole('link', { name: 'Review changes' })).toHaveAttribute(
      'href',
      '/room/vcs',
    )
  })

  it('shows language, cursor and the Tab focus shortcut in the status bar', async () => {
    stubTask()
    const { user } = renderEditor()
    await editor()
    const status = screen.getByRole('status')

    await user.click(screen.getByRole('button', { name: 'move cursor' }))

    expect(status).toHaveTextContent('Editing')
    expect(status).toHaveTextContent('Java')
    expect(status).toHaveTextContent('Ln 4, Col 2')
    expect(status).toHaveTextContent(/Ctrl\+(Shift\+)?M: Tab moves focus/)
    expect(status).toHaveTextContent('0 files changed')
  })

  it('locks the files while the push waits for review', async () => {
    stubTask({ status: 'SUBMITTED' })
    renderEditor()

    const locked = await screen.findByRole('textbox', { name: 'Read-only UserController.java' })
    expect(locked).toHaveAttribute('readonly')
    expect(fileTab('UserController.java')).toHaveAccessibleName(/read-only/)
    expect(screen.getByText(/waiting for review/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Read-only')
    expect(screen.queryByRole('button', { name: 'Reset file' })).not.toBeInTheDocument()
  })

  it('asks to start an assigned task first', async () => {
    stubTask({ status: 'ASSIGNED' })
    renderEditor()

    expect(await screen.findByText(/Start the task/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to the task board' })).toHaveAttribute(
      'href',
      '/room/task',
    )
  })

  it('points to the codebase when the task has no files to edit', async () => {
    stubTask({ focusFiles: [] })
    renderEditor()

    expect(await screen.findByText(/no files to edit/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explore the codebase' })).toHaveAttribute(
      'href',
      '/room/codebase',
    )
  })

  it('points to the codebase when there is no task', async () => {
    stubApi({ 'GET /api/tasks/today': new Response('null', { status: 200 }) })
    renderEditor()

    expect(await screen.findByText(/no files to edit/)).toBeInTheDocument()
  })

  it('shows a load error', async () => {
    stubApi({ 'GET /api/tasks/today': new Response('{}', { status: 500 }) })
    renderEditor()

    expect(await screen.findByText("Failed to load today's task")).toBeInTheDocument()
  })
})
