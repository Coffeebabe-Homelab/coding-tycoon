import { Activity, useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeEditor } from './CodeEditor'
import { LazyCodeEditor } from './LazyCodeEditor'

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

// Monaco can't run in jsdom. The stub exposes what CodeEditor hands to it, and fires onChange.
vi.mock('@monaco-editor/react', () => ({
  loader: { config: () => {} },
  default: StubEditor,
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
