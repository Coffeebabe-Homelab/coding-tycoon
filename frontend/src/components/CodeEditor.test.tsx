import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeEditor } from './CodeEditor'
import { LazyCodeEditor } from './LazyCodeEditor'

const monacoEditor = vi.hoisted(() => ({ defineTheme: vi.fn(), remeasureFonts: vi.fn() }))

// Monaco can't run in jsdom. The stub exposes what CodeEditor hands to it, and fires onChange.
vi.mock('@monaco-editor/react', () => ({
  loader: { config: () => {} },
  default: ({
    language,
    value,
    options,
    onChange,
    beforeMount,
    onMount,
  }: {
    language: string
    value: string
    options: { readOnly: boolean; domReadOnly: boolean; fontSize: number; lineHeight: number }
    onChange: (next: string | undefined) => void
    beforeMount: () => void
    onMount: () => void
  }) => (
    <div>
      <p>{`${language}: ${value}`}</p>
      <p>{`readOnly=${options.readOnly} domReadOnly=${options.domReadOnly}`}</p>
      <p>{`size=${options.fontSize}/${options.lineHeight}`}</p>
      <button
        onClick={() => {
          beforeMount()
          onMount()
        }}
      >
        mount
      </button>
      <button onClick={() => onChange('edited')}>type</button>
      <button onClick={() => onChange(undefined)}>clear</button>
    </div>
  ),
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

describe('LazyCodeEditor', () => {
  it('shows a loading message, then the editor', async () => {
    render(<LazyCodeEditor {...PROPS} readOnly />)

    expect(screen.getByText('Loading editor…')).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Viewing A.java' })).toBeInTheDocument()
  })
})
