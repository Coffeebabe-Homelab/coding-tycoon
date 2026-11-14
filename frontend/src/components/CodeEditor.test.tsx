import { Activity, useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeDiff, CodeEditor } from './CodeEditor'
import { LazyCodeEditor } from './LazyCodeEditor'
import { DiffView } from './DiffView'

const monacoEditor = vi.hoisted(() => ({ defineTheme: vi.fn(), remeasureFonts: vi.fn() }))
const stubEditor = vi.hoisted(() => ({
  saveViewState: vi.fn(),
  restoreViewState: vi.fn(),
  getPosition: vi.fn(),
  onDidChangeCursorPosition: vi.fn(),
}))
const editorIds = vi.hoisted(() => ({ next: 0 }))

function StubEditor({
  language,
  value,
  path,
  keepCurrentModel,
  options,
  onChange,
  beforeMount,
  onMount,
}: {
  language: string
  value: string
  path?: string
  keepCurrentModel: boolean
  options: { readOnly: boolean; domReadOnly: boolean; fontSize: number; lineHeight: number }
  onChange: (next: string | undefined) => void
  beforeMount: () => void
  onMount: (editor: typeof stubEditor) => void
}) {
  const [id] = useState(() => ++editorIds.next)
  return (
    <div>
      <p data-testid="editor-id">{id}</p>
      <p>{`${language}: ${value}`}</p>
      <p>{`readOnly=${options.readOnly} domReadOnly=${options.domReadOnly}`}</p>
      <p>{`size=${options.fontSize}/${options.lineHeight}`}</p>
      <p>{`path=${path ?? 'none'} keep=${keepCurrentModel}`}</p>
      <button
        onClick={() => {
          beforeMount()
          onMount(stubEditor)
        }}
      >
        mount
      </button>
      <button onClick={() => onChange('edited')}>type</button>
      <button onClick={() => onChange(undefined)}>clear</button>
    </div>
  )
}

const stubDiffEditor = vi.hoisted(() => ({
  onDidUpdateDiff: vi.fn(),
  getLineChanges: vi.fn(),
}))

function StubDiffEditor({
  original,
  modified,
  originalModelPath,
  modifiedModelPath,
  keepCurrentOriginalModel,
  keepCurrentModifiedModel,
  options,
  onMount,
}: {
  original: string
  modified: string
  originalModelPath: string
  modifiedModelPath: string
  keepCurrentOriginalModel: boolean
  keepCurrentModifiedModel: boolean
  options: { renderSideBySide: boolean; readOnly: boolean; ariaLabel: string }
  onMount: (editor: typeof stubDiffEditor) => void
}) {
  const [id] = useState(() => ++editorIds.next)
  return (
    <div>
      <p data-testid="diff-id">{id}</p>
      <p>{`${original} -> ${modified}`}</p>
      <p>{`${originalModelPath} | ${modifiedModelPath}`}</p>
      <p>{`keep=${keepCurrentOriginalModel}/${keepCurrentModifiedModel}`}</p>
      <p>{`split=${options.renderSideBySide} readOnly=${options.readOnly}`}</p>
      <button onClick={() => onMount(stubDiffEditor)}>mount diff</button>
    </div>
  )
}

// Monaco can't run in jsdom. The stubs expose what CodeEditor hands to them, and fire callbacks.
vi.mock('@monaco-editor/react', () => ({
  loader: { config: () => {} },
  default: StubEditor,
  DiffEditor: StubDiffEditor,
}))
vi.mock('monaco-editor', () => ({ editor: monacoEditor }))
vi.mock('monaco-editor/editor/editor.worker?worker', () => ({ default: class {} }))
vi.mock('monaco-editor/language/json/json.worker?worker', () => ({ default: class {} }))

const PROPS = { value: 'class A {}', language: 'java', ariaLabel: 'Viewing A.java' }

describe('CodeEditor', () => {
  it('exposes a labelled region and passes the content through', () => {
    render(<CodeEditor {...PROPS} readOnly />)

    expect(screen.getByRole('region', { name: 'Viewing A.java' })).toBeInTheDocument()
    expect(screen.getByText('java: class A {}')).toBeInTheDocument()
  })

  it('locks both editing surfaces when read-only', () => {
    render(<CodeEditor {...PROPS} readOnly />)

    expect(screen.getByText('readOnly=true domReadOnly=true')).toBeInTheDocument()
  })

  it('allows editing when not read-only', () => {
    render(<CodeEditor {...PROPS} readOnly={false} />)

    expect(screen.getByText('readOnly=false domReadOnly=false')).toBeInTheDocument()
  })

  it('reports edits, treating an emptied editor as an empty string', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<CodeEditor {...PROPS} readOnly={false} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'type' }))
    expect(onChange).toHaveBeenLastCalledWith('edited')

    await user.click(screen.getByRole('button', { name: 'clear' }))
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('gives each file its own model, kept when the editor is replaced', () => {
    render(<CodeEditor {...PROPS} readOnly={false} path="draft/src/A.java" />)

    // One model per path keeps undo history per file; hiding a tab replaces the editor.
    expect(screen.getByText('path=draft/src/A.java keep=true')).toBeInTheDocument()
  })

  it('drops unnamed models with their editor', () => {
    render(<CodeEditor {...PROPS} readOnly />)

    expect(screen.getByText('path=none keep=false')).toBeInTheDocument()
  })

  it('reports the cursor position on mount and when it moves', async () => {
    const onCursorChange = vi.fn()
    stubEditor.getPosition.mockReturnValue({ lineNumber: 1, column: 1 })
    // jsdom has no FontFaceSet; mounting waits on the mono font.
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { load: () => Promise.resolve([]) },
    })
    const user = userEvent.setup()
    render(<CodeEditor {...PROPS} readOnly={false} onCursorChange={onCursorChange} />)

    await user.click(screen.getByRole('button', { name: 'mount' }))
    expect(onCursorChange).toHaveBeenLastCalledWith(1, 1)

    const [listener] = stubEditor.onDidChangeCursorPosition.mock.lastCall!
    listener({ position: { lineNumber: 3, column: 7 } })
    expect(onCursorChange).toHaveBeenLastCalledWith(3, 7)
  })

  it('tolerates edits with no change handler', async () => {
    const user = userEvent.setup()
    render(<CodeEditor {...PROPS} readOnly />)

    await user.click(screen.getByRole('button', { name: 'type' }))

    expect(screen.getByText('java: class A {}')).toBeInTheDocument()
  })
})

describe('CodeEditor theme', () => {
  const fontsLoad = vi.fn(() => Promise.resolve([]))

  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom has no FontFaceSet.
    Object.defineProperty(document, 'fonts', { configurable: true, value: { load: fontsLoad } })
    document.documentElement.style.setProperty('--color-bg-base', '#0b0918')
    document.documentElement.style.setProperty('--color-accent-hover', '#ffa366')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('style')
  })

  it('uses the Code/M size from the design', () => {
    render(<CodeEditor {...PROPS} readOnly />)

    expect(screen.getByText('size=13/20')).toBeInTheDocument()
  })

  it('remeasures once the mono font has loaded, so the selection lines up', async () => {
    const user = userEvent.setup()
    render(<CodeEditor {...PROPS} readOnly />)

    await user.click(screen.getByRole('button', { name: 'mount' }))

    expect(fontsLoad).toHaveBeenCalledWith('13px "JetBrains Mono Variable"')
    await waitFor(() => expect(monacoEditor.remeasureFonts).toHaveBeenCalledOnce())
  })

  it('builds the theme from tokens, dropping the # and any token not emitted', async () => {
    const user = userEvent.setup()
    render(<CodeEditor {...PROPS} readOnly />)

    await user.click(screen.getByRole('button', { name: 'mount' }))

    const [, theme] = monacoEditor.defineTheme.mock.calls[0]
    expect(theme.colors['editor.background']).toBe('#0b0918')
    expect(theme.rules).toEqual([{ token: 'keyword', foreground: 'ffa366' }])
  })
})

describe('CodeEditor inside a hidden tab', () => {
  const inTab = (mode: 'visible' | 'hidden') => (
    <Activity mode={mode}>
      <CodeEditor {...PROPS} readOnly />
    </Activity>
  )
  const mount = () => userEvent.click(screen.getByRole('button', { name: 'mount' }))
  const editorId = () => screen.getByTestId('editor-id').textContent

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { load: () => Promise.resolve([]) },
    })
  })

  it('starts a new editor when the tab comes back, since hiding destroys the old one', async () => {
    const { rerender } = render(inTab('visible'))
    await mount()
    const firstId = editorId()

    rerender(inTab('hidden'))
    rerender(inTab('visible'))

    await waitFor(() => expect(editorId()).not.toBe(firstId))
  })

  it('restores scroll and cursor in the new editor', async () => {
    stubEditor.saveViewState.mockReturnValue('saved view')
    const { rerender } = render(inTab('visible'))
    await mount()
    expect(stubEditor.restoreViewState).not.toHaveBeenCalled()

    rerender(inTab('hidden'))
    rerender(inTab('visible'))
    await mount()

    expect(stubEditor.restoreViewState).toHaveBeenCalledExactlyOnceWith('saved view')
  })

  it('keeps the saved view if the tab hides again before the new editor is ready', async () => {
    stubEditor.saveViewState.mockReturnValue('saved view')
    const { rerender } = render(inTab('visible'))
    await mount()

    rerender(inTab('hidden'))
    rerender(inTab('visible'))
    rerender(inTab('hidden'))
    rerender(inTab('visible'))
    await mount()

    expect(stubEditor.saveViewState).toHaveBeenCalledOnce()
    expect(stubEditor.restoreViewState).toHaveBeenCalledExactlyOnceWith('saved view')
  })
})

describe('LazyCodeEditor', () => {
  it('shows a loading message, then the editor', async () => {
    render(<LazyCodeEditor {...PROPS} readOnly />)

    expect(screen.getByText('Loading editor…')).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Viewing A.java' })).toBeInTheDocument()
  })
})

describe('CodeDiff', () => {
  const DIFF = {
    original: 'old',
    modified: 'new',
    language: 'java',
    path: 'src/A.java',
    split: false,
    ariaLabel: 'Changes to A.java',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('compares the original with the draft, read-only, one model pair per file', () => {
    render(<CodeDiff {...DIFF} />)

    expect(screen.getByRole('region', { name: 'Changes to A.java' })).toBeInTheDocument()
    expect(screen.getByText('old -> new')).toBeInTheDocument()
    expect(
      screen.getByText('diff-original/src/A.java | diff-modified/src/A.java'),
    ).toBeInTheDocument()
    // Disposing the models first makes Monaco's diff widget throw, so they are kept per path.
    expect(screen.getByText('keep=true/true')).toBeInTheDocument()
  })

  it('renders unified or split', () => {
    const { rerender } = render(<CodeDiff {...DIFF} />)
    expect(screen.getByText('split=false readOnly=true')).toBeInTheDocument()

    rerender(<CodeDiff {...DIFF} split />)
    expect(screen.getByText('split=true readOnly=true')).toBeInTheDocument()
  })

  it('reports added and removed lines whenever the diff updates', async () => {
    const onLineCounts = vi.fn()
    stubDiffEditor.getLineChanges.mockReturnValue([
      {
        originalStartLineNumber: 3,
        originalEndLineNumber: 3,
        modifiedStartLineNumber: 3,
        modifiedEndLineNumber: 5,
      },
      // Pure insertion: Monaco marks "no original lines" with an end line of 0.
      {
        originalStartLineNumber: 9,
        originalEndLineNumber: 0,
        modifiedStartLineNumber: 12,
        modifiedEndLineNumber: 12,
      },
      // Pure deletion.
      {
        originalStartLineNumber: 20,
        originalEndLineNumber: 21,
        modifiedStartLineNumber: 22,
        modifiedEndLineNumber: 0,
      },
    ])
    render(<CodeDiff {...DIFF} onLineCounts={onLineCounts} />)

    await userEvent.click(screen.getByRole('button', { name: 'mount diff' }))
    const [listener] = stubDiffEditor.onDidUpdateDiff.mock.lastCall!
    listener()

    expect(onLineCounts).toHaveBeenLastCalledWith(4, 3)
  })

  it('counts nothing before the first diff is ready', async () => {
    const onLineCounts = vi.fn()
    stubDiffEditor.getLineChanges.mockReturnValue(null)
    render(<CodeDiff {...DIFF} onLineCounts={onLineCounts} />)

    await userEvent.click(screen.getByRole('button', { name: 'mount diff' }))
    stubDiffEditor.onDidUpdateDiff.mock.lastCall![0]()

    expect(onLineCounts).toHaveBeenLastCalledWith(0, 0)
  })

  it('starts a new diff editor when its tab comes back', async () => {
    const inTab = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <CodeDiff {...DIFF} />
      </Activity>
    )
    const { rerender } = render(inTab('visible'))
    const firstId = screen.getByTestId('diff-id').textContent

    rerender(inTab('hidden'))
    rerender(inTab('visible'))

    await waitFor(() => expect(screen.getByTestId('diff-id').textContent).not.toBe(firstId))
  })

  it('loads lazily through DiffView', async () => {
    render(<DiffView {...DIFF} />)

    expect(screen.getByText('Loading diff…')).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Changes to A.java' })).toBeInTheDocument()
  })
})
