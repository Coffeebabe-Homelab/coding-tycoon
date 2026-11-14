import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

const onConfirm = vi.fn()
const outerKeyDown = vi.fn()

function Opener({ disableOnConfirm = false }) {
  const [open, setOpen] = useState(false)
  const [disabled, setDisabled] = useState(false)
  return (
    <div onKeyDown={outerKeyDown}>
      <button disabled={disabled} onClick={() => setOpen(true)}>
        Reset file
      </button>
      {open && (
        <Modal
          title="Reset file?"
          confirmLabel="Reset"
          onConfirm={() => {
            onConfirm()
            if (disableOnConfirm) setDisabled(true)
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        >
          Your changes are lost.
        </Modal>
      )}
    </div>
  )
}

async function open(disableOnConfirm = false) {
  const user = userEvent.setup()
  render(<Opener disableOnConfirm={disableOnConfirm} />)
  await user.click(screen.getByRole('button', { name: 'Reset file' }))
  return user
}

describe('Modal', () => {
  it('asks with a title and message, starting on Cancel', async () => {
    await open()

    expect(screen.getByRole('alertdialog', { name: 'Reset file?' })).toHaveAccessibleDescription(
      'Your changes are lost.',
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('confirms', async () => {
    const user = await open()

    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('cancels on Escape without letting the key reach the panel, and refocuses the opener', async () => {
    const user = await open()
    outerKeyDown.mockClear()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(outerKeyDown).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Reset file' })).toHaveFocus()
  })

  it('keeps Tab inside', async () => {
    const user = await open()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Reset' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('lets other keys through', async () => {
    const user = await open()
    outerKeyDown.mockClear()

    await user.keyboard('a')

    expect(outerKeyDown).toHaveBeenCalled()
  })

  it('leaves focus to the caller when the opener got disabled', async () => {
    const user = await open(true)

    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.getByRole('button', { name: 'Reset file' })).not.toHaveFocus()
  })
})
