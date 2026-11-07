import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FileTree } from './FileTree'
import { buildFileTree } from '../lib/fileTree'

const PATHS = ['src/main/App.java', 'src/main/User.java', 'docs/guide.md', 'README.md']

function renderTree({
  selectedPath = null,
  focusFiles = [],
}: { selectedPath?: string | null; focusFiles?: string[] } = {}) {
  const onSelect = vi.fn()
  render(
    <FileTree
      nodes={buildFileTree(PATHS)}
      selectedPath={selectedPath}
      focusFiles={focusFiles}
      onSelect={onSelect}
    />,
  )
  return { onSelect, user: userEvent.setup() }
}

const folder = (name: string) => screen.getByRole('button', { name: new RegExp(`${name}$`) })
const file = (name: RegExp | string) => screen.getByRole('button', { name })
const queryFile = (name: RegExp | string) => screen.queryByRole('button', { name })

describe('FileTree', () => {
  it('is a labelled navigation region', () => {
    renderTree()

    expect(screen.getByRole('navigation', { name: 'Codebase files' })).toBeInTheDocument()
  })

  it('starts collapsed, showing only the top level', () => {
    renderTree()

    expect(folder('src')).toHaveAttribute('aria-expanded', 'false')
    expect(file(/README\.md/)).toBeInTheDocument()
    expect(queryFile(/App\.java/)).not.toBeInTheDocument()
  })

  it('expands and collapses a folder on click', async () => {
    const { user } = renderTree()

    await user.click(folder('docs'))
    expect(folder('docs')).toHaveAttribute('aria-expanded', 'true')
    expect(file(/guide\.md/)).toBeInTheDocument()

    await user.click(folder('docs'))
    expect(folder('docs')).toHaveAttribute('aria-expanded', 'false')
    expect(queryFile(/guide\.md/)).not.toBeInTheDocument()
  })

  it('expands folders down to focus files and marks them for screen readers', () => {
    renderTree({ focusFiles: ['src/main/App.java'] })

    expect(folder('src')).toHaveAttribute('aria-expanded', 'true')
    expect(folder('main')).toHaveAttribute('aria-expanded', 'true')
    expect(file(/App\.java\s*\(focus file\)/)).toBeInTheDocument()
    expect(file(/User\.java/)).not.toHaveAccessibleName(/focus file/)
  })

  it('expands folders down to the selected file and marks it current', () => {
    renderTree({ selectedPath: 'docs/guide.md' })

    expect(file(/guide\.md/)).toHaveAttribute('aria-current', 'true')
    expect(file(/README\.md/)).not.toHaveAttribute('aria-current')
    expect(folder('src')).toHaveAttribute('aria-expanded', 'false')
  })

  it('reports the full path when a file is clicked', async () => {
    const { onSelect, user } = renderTree({ focusFiles: ['src/main/App.java'] })

    await user.click(file(/App\.java/))

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('src/main/App.java')
  })

  it('does not report folders as selections', async () => {
    const { onSelect, user } = renderTree()

    await user.click(folder('src'))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('works from the keyboard', async () => {
    const { onSelect, user } = renderTree()

    await user.tab()
    expect(folder('docs')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(file(/guide\.md/)).toBeInTheDocument()
    await user.keyboard(' ')
    expect(queryFile(/guide\.md/)).not.toBeInTheDocument()

    await user.tab()
    await user.tab()
    expect(file(/README\.md/)).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('README.md')
  })
})
