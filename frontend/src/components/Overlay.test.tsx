import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Overlay } from './Overlay'
import { LocationProbe } from '../test/LocationProbe'

function Opener() {
  const navigate = useNavigate()
  return <button onClick={() => navigate('/room/panel')}>open panel</button>
}

function renderOverlay() {
  render(
    <MemoryRouter initialEntries={['/room/panel']}>
      <LocationProbe />
      <Routes>
        <Route path="/room" element={null} />
        <Route
          path="/room/panel"
          element={
            <Overlay title="Task Board">
              <button>inside</button>
            </Overlay>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const location = () => screen.getByTestId('location')

describe('Overlay', () => {
  it('is a labelled modal dialog that takes focus', () => {
    renderOverlay()

    const dialog = screen.getByRole('dialog', { name: 'Task Board' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveFocus()
    expect(screen.getByRole('button', { name: 'inside' })).toBeInTheDocument()
  })

  it('closes to the room on Escape', async () => {
    const user = renderOverlay()

    await user.keyboard('{Escape}')

    expect(location()).toHaveTextContent(/^\/room$/)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('ignores other keys', async () => {
    const user = renderOverlay()

    await user.keyboard('a')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes to the room from the close button', async () => {
    const user = renderOverlay()

    await user.click(screen.getByRole('button', { name: 'Close panel' }))

    expect(location()).toHaveTextContent(/^\/room$/)
  })

  it('closes on a backdrop click but not on a click inside the panel', async () => {
    const user = renderOverlay()
    const backdrop = screen.getByRole('dialog').parentElement as HTMLElement

    await user.click(screen.getByRole('heading', { name: 'Task Board' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(backdrop)
    expect(location()).toHaveTextContent(/^\/room$/)
  })

  it('keeps Tab and Shift+Tab inside the panel', async () => {
    const user = renderOverlay()
    const close = screen.getByRole('button', { name: 'Close panel' })
    const inside = screen.getByRole('button', { name: 'inside' })

    await user.tab()
    expect(close).toHaveFocus()
    await user.tab()
    expect(inside).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(inside).toHaveFocus()
  })

  it('wraps Shift+Tab from the panel itself to the last control', async () => {
    const user = renderOverlay()

    await user.tab({ shift: true })

    expect(screen.getByRole('button', { name: 'inside' })).toHaveFocus()
  })

  it('returns focus to whatever opened it', async () => {
    render(
      <MemoryRouter initialEntries={['/room']}>
        <Opener />
        <Routes>
          <Route path="/room" element={null} />
          <Route path="/room/panel" element={<Overlay title="Task Board">body</Overlay>} />
        </Routes>
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    const opener = screen.getByRole('button', { name: 'open panel' })

    await user.click(opener)
    expect(screen.getByRole('dialog')).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(opener).toHaveFocus()
  })
})
