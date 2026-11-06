import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth0 } from '@auth0/auth0-react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CodebaseExplorerPage from './CodebaseExplorerPage'
import type { CodeEditorProps } from '../components/CodeEditor'
import { authState, jsonResponse, stubApi } from '../test/helpers'
import { LocationProbe } from '../test/LocationProbe'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }))

// Monaco is heavy and isn't the subject here; the stub shows what the page hands to it.
vi.mock('../components/LazyCodeEditor', () => ({
  LazyCodeEditor: ({ value, language, readOnly, ariaLabel }: CodeEditorProps) => (
    <textarea aria-label={ariaLabel} data-language={language} readOnly={readOnly} value={value} />
  ),
}))

const FILES_ROUTE = 'GET /api/codebase/files'
const CODEBASE = {
  codebase: 'shopfront',
  focusFiles: ['src/App.java'],
  files: ['README.md', 'src/App.java'],
}
const FILE_ROUTES = {
  'GET /api/codebase/files/src/App.java': { path: 'src/App.java', content: 'class App {}' },
  'GET /api/codebase/files/README.md': { path: 'README.md', content: '# Shop' },
}

function renderExplorer(path = '/room/codebase') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <LocationProbe />
      <CodebaseExplorerPage />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

describe('CodebaseExplorerPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue(authState())
  })

  it('opens the first focus file read-only, with its language', async () => {
    stubApi({ [FILES_ROUTE]: CODEBASE, ...FILE_ROUTES })

    renderExplorer()
    expect(screen.getByText('Loading codebase…')).toBeInTheDocument()

    const editor = await screen.findByRole('textbox', { name: 'Read-only view of src/App.java' })
    expect(editor).toHaveValue('class App {}')
    expect(editor).toHaveAttribute('readonly')
    expect(editor).toHaveAttribute('data-language', 'java')
  })

  it('opens the first file when the task has no focus files', async () => {
    stubApi({ [FILES_ROUTE]: { ...CODEBASE, focusFiles: [] }, ...FILE_ROUTES })

    renderExplorer()

    expect(await screen.findByRole('textbox', { name: /README\.md/ })).toHaveValue('# Shop')
  })

  it('opens the file named in the URL', async () => {
    stubApi({ [FILES_ROUTE]: CODEBASE, ...FILE_ROUTES })

    renderExplorer('/room/codebase?file=README.md')

    expect(await screen.findByRole('textbox', { name: /README\.md/ })).toHaveValue('# Shop')
  })

  it('selecting a file updates the URL and the editor', async () => {
    stubApi({ [FILES_ROUTE]: CODEBASE, ...FILE_ROUTES })
    const user = renderExplorer()
    await screen.findByRole('textbox', { name: /App\.java/ })

    await user.click(screen.getByRole('button', { name: /README\.md/ }))

    expect(await screen.findByRole('textbox', { name: /README\.md/ })).toHaveValue('# Shop')
    expect(screen.getByTestId('location')).toHaveTextContent('/room/codebase?file=README.md')
  })

  it('points to the task board when there is no active task', async () => {
    stubApi({ [FILES_ROUTE]: jsonResponse({}, 404) })

    renderExplorer()

    expect(await screen.findByText(/no codebase to explore/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to the task board' })).toHaveAttribute(
      'href',
      '/room/task',
    )
  })

  it('shows an error when the file list cannot load', async () => {
    stubApi({ [FILES_ROUTE]: jsonResponse({}, 500) })

    renderExplorer()

    expect(await screen.findByText('Failed to load the codebase')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows an error when a file cannot open', async () => {
    stubApi({
      [FILES_ROUTE]: CODEBASE,
      'GET /api/codebase/files/src/App.java': jsonResponse({}, 500),
    })

    renderExplorer()

    await waitFor(() => expect(screen.getByText('Failed to open src/App.java')).toBeInTheDocument())
  })
})
