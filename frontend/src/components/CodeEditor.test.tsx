import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CodeEditor } from './CodeEditor'
import { LazyCodeEditor } from './LazyCodeEditor'

// Monaco can't run in jsdom. The stub exposes what CodeEditor hands to it, and fires onChange.
vi.mock('@monaco-editor/react', () => ({
  loader: { config: () => {} },
  default: ({
    language,
    value,
    options,
    onChange,
  }: {
    language: string
    value: string
    options: { readOnly: boolean; domReadOnly: boolean }
    onChange: (next: string | undefined) => void
  }) => (
    <div>
      <p>{`${language}: ${value}`}</p>
      <p>{`readOnly=${options.readOnly} domReadOnly=${options.domReadOnly}`}</p>
      <button onClick={() => onChange('edited')}>type</button>
      <button onClick={() => onChange(undefined)}>clear</button>
    </div>
  ),
}))
vi.mock('monaco-editor', () => ({ editor: { defineTheme: () => {} } }))
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

describe('LazyCodeEditor', () => {
  it('shows a loading message, then the editor', async () => {
    render(<LazyCodeEditor {...PROPS} readOnly />)

    expect(screen.getByText('Loading editor…')).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Viewing A.java' })).toBeInTheDocument()
  })
})
