import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EditorTab } from './EditorTab'

const PATH = 'src/main/java/com/shopfront/user/UserController.java'

function renderTab(props: Partial<Parameters<typeof EditorTab>[0]> = {}) {
  const onSelect = vi.fn()
  render(
    <div role="tablist">
      <EditorTab
        path={PATH}
        active
        readOnly={false}
        panelId="panel"
        onSelect={onSelect}
        {...props}
      />
    </div>,
  )
  return onSelect
}

describe('EditorTab', () => {
  it('names the tab after the file and keeps the full path as a hint', () => {
    renderTab()

    const tab = screen.getByRole('tab', { name: 'UserController.java' })
    expect(tab).toHaveAttribute('title', PATH)
    expect(tab).toHaveAttribute('aria-controls', 'panel')
  })

  it('puts only the active tab in the Tab order', () => {
    renderTab({ active: false })

    const tab = screen.getByRole('tab')
    expect(tab).toHaveAttribute('aria-selected', 'false')
    expect(tab).toHaveAttribute('tabindex', '-1')
  })

  it('marks a read-only file with a lock', () => {
    renderTab({ readOnly: true })

    expect(
      screen.getByRole('tab', { name: /^UserController\.java ?\(read-only\)$/ }),
    ).toBeInTheDocument()
  })

  it('selects on click', async () => {
    const onSelect = renderTab({ active: false })

    await userEvent.click(screen.getByRole('tab'))

    expect(onSelect).toHaveBeenCalledOnce()
  })
})
