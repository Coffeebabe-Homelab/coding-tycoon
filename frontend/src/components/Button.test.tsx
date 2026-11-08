import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button, buttonClasses } from './Button'

describe('Button', () => {
  it('renders its label and defaults to type="button" so it never submits a form', () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button')
  })

  it('fires onClick', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Save</Button>)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <Button onClick={onClick} disabled>
        Save
      </Button>,
    )

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('passes aria attributes through', () => {
    render(<Button aria-describedby="hint">Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-describedby', 'hint')
  })

  it('is primary by default and applies the requested variant', () => {
    render(
      <>
        <Button>Save</Button>
        <Button variant="danger">Delete</Button>
      </>,
    )

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('bg-accent')
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-danger-subtle')
  })

  it('exposes the classes so a router Link can look like a button', () => {
    expect(buttonClasses('secondary')).toContain('bg-bg-elevated')
  })
})
