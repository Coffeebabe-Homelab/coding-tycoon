import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Chip } from './Chip'

describe('Chip', () => {
  it.each([true, false])('exposes selected=%s through aria-pressed', (selected) => {
    render(<Chip label="REST" selected={selected} onClick={() => {}} />)

    expect(screen.getByRole('button', { name: 'REST' })).toHaveAttribute(
      'aria-pressed',
      String(selected),
    )
  })

  it('reports clicks', async () => {
    const onClick = vi.fn()
    render(<Chip label="REST" onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: 'REST' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('shows a check only when selected', () => {
    const { rerender } = render(<Chip label="REST" onClick={() => {}} />)
    expect(screen.getByRole('button').querySelector('svg')).toBeNull()

    rerender(<Chip label="REST" selected onClick={() => {}} />)
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument()
  })

  it('renders a read-only tag as plain text', () => {
    render(<Chip label="REST" />)

    expect(screen.getByText('REST')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
