import { useEffect, useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PanelWindow, type PanelTab } from './PanelWindow'
import { FileTree } from './FileTree'
import { buildFileTree } from '../lib/fileTree'
import { LocationProbe } from '../test/LocationProbe'

const onShown = vi.fn()

function Counter() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    onShown()
  }, [])
  return <button onClick={() => setCount(count + 1)}>count {count}</button>
}

const TREE = buildFileTree(['src/App.java'])

const TABS: PanelTab[] = [
  { path: 'task', label: 'Task Board', element: <Counter /> },
  {
    path: 'codebase',
    label: 'Codebase',
    element: <FileTree nodes={TREE} selectedPath={null} focusFiles={[]} onSelect={() => {}} />,
  },
]

function Room() {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate(-1)}>browser back</button>
      <Link to="/room/task">open panel</Link>
      <Outlet />
    </>
  )
}

function renderWindow(path = '/room/task') {
  render(
    <MemoryRouter initialEntries={['/room', path]}>
      <LocationProbe />
      <Routes>
        <Route path="/room" element={<Room />}>
          <Route element={<PanelWindow tabs={TABS} />}>
            <Route index element={null} />
            <Route path="task" element={null} />
            <Route path="codebase" element={null} />
            <Route path="end-of-day" element={<p>end of day</p>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const tab = (name: string) => screen.getByRole('link', { name })
const location = () => screen.getByTestId('location')
const openFolder = () => screen.getByRole('button', { name: /src/ })

describe('PanelWindow', () => {
  beforeEach(() => {
    onShown.mockClear()
  })

  describe('keeping tabs alive', () => {
    it('keeps a tab state across a tab switch', async () => {
      const user = renderWindow()

      await user.click(screen.getByRole('button', { name: 'count 0' }))
      await user.click(tab('Codebase'))
      await user.click(tab('Task Board'))

      expect(screen.getByRole('button', { name: 'count 1' })).toBeVisible()
    })

    it('keeps expanded folders across a tab switch', async () => {
      const user = renderWindow('/room/codebase')

      await user.click(openFolder())
      expect(openFolder()).toHaveAttribute('aria-expanded', 'true')
      await user.click(tab('Task Board'))
      await user.click(tab('Codebase'))

      expect(openFolder()).toHaveAttribute('aria-expanded', 'true')
    })

    it('keeps tab state when the panel closes and reopens', async () => {
      const user = renderWindow()

      await user.click(screen.getByRole('button', { name: 'count 0' }))
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      await user.click(screen.getByRole('link', { name: 'open panel' }))

      expect(screen.getByRole('button', { name: 'count 1' })).toBeVisible()
    })

    it('reruns effects when a tab comes back, so its data refreshes', async () => {
      const user = renderWindow()
      expect(onShown).toHaveBeenCalledTimes(1)

      await user.click(tab('Codebase'))
      await user.click(tab('Task Board'))

      expect(onShown).toHaveBeenCalledTimes(2)
    })

    it('only mounts tabs that were visited', () => {
      renderWindow('/room/codebase')

      expect(onShown).not.toHaveBeenCalled()
    })

    it('hides the other tab', async () => {
      const user = renderWindow()

      await user.click(tab('Codebase'))

      expect(screen.getByText('count 0')).not.toBeVisible()
    })
  })

  describe('tabs', () => {
    it('labels the dialog with the current tab', async () => {
      const user = renderWindow()
      expect(screen.getByRole('dialog', { name: 'Task Board' })).toBeInTheDocument()

      await user.click(tab('Codebase'))

      expect(screen.getByRole('dialog', { name: 'Codebase' })).toBeInTheDocument()
    })

    it('marks only the current tab', () => {
      renderWindow()

      expect(tab('Task Board')).toHaveAttribute('aria-current', 'page')
      expect(tab('Codebase')).not.toHaveAttribute('aria-current')
    })

    it('links each tab to its route', () => {
      renderWindow()

      expect(tab('Task Board')).toHaveAttribute('href', '/room/task')
      expect(tab('Codebase')).toHaveAttribute('href', '/room/codebase')
    })

    it('replaces history, so Back closes the panel instead of walking through tabs', async () => {
      const user = renderWindow()

      await user.click(tab('Codebase'))
      await user.click(tab('Task Board'))
      await user.click(tab('Codebase'))
      await user.click(screen.getByRole('button', { name: 'browser back' }))

      expect(location()).toHaveTextContent(/^\/room$/)
    })

    it('keeps focus on the tab that was clicked', async () => {
      const user = renderWindow()

      await user.click(tab('Codebase'))

      expect(tab('Codebase')).toHaveFocus()
    })
  })

  describe('as a dialog', () => {
    it('is not shown with no tab open', () => {
      renderWindow('/room')

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders non-tab routes through the outlet, without the window', () => {
      renderWindow('/room/end-of-day')

      expect(screen.getByText('end of day')).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('takes focus when opened', () => {
      renderWindow()

      expect(screen.getByRole('dialog')).toHaveFocus()
    })

    it('closes to the room on Escape', async () => {
      const user = renderWindow()

      await user.keyboard('{Escape}')

      expect(location()).toHaveTextContent(/^\/room$/)
    })

    it('closes to the room from Back to room', async () => {
      const user = renderWindow()

      await user.click(screen.getByRole('link', { name: /Back to room/ }))

      expect(location()).toHaveTextContent(/^\/room$/)
    })

    it('returns focus to the opener on every open', async () => {
      const user = renderWindow('/room')
      const opener = screen.getByRole('link', { name: 'open panel' })

      for (let open = 0; open < 2; open++) {
        await user.click(opener)
        expect(screen.getByRole('dialog')).toHaveFocus()
        await user.keyboard('{Escape}')
        expect(opener).toHaveFocus()
      }
    })

    it('never tabs into a hidden tab', async () => {
      // Codebase comes last in the DOM, so a trap that counted it would stop on it.
      const user = renderWindow('/room/codebase')
      await user.click(tab('Task Board'))

      screen.getByRole('button', { name: 'count 0' }).focus()
      await user.tab()

      expect(tab('Task Board')).toHaveFocus()
    })
  })
})
