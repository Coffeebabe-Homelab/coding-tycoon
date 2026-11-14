import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from './Input'

function Controlled({ disabled = false }) {
  const [value, setValue] = useState('')
  return (
    <Input
      label="Commit message"
      value={value}
      onChange={setValue}
      helper={`${value.length} / 5`}
      maxLength={5}
      disabled={disabled}
    />
  )
}

describe('Input', () => {
  it('labels the field and describes it with the helper', () => {
    render(<Controlled />)

    const field = screen.getByRole('textbox', { name: 'Commit message' })
    expect(field).toHaveAccessibleDescription('0 / 5')
  })

  it('reports typing and stops at the limit', async () => {
    render(<Controlled />)

    await userEvent.type(screen.getByRole('textbox'), 'feat: x')

    expect(screen.getByRole('textbox')).toHaveValue('feat:')
    expect(screen.getByText('5 / 5')).toBeInTheDocument()
  })

  it('can be disabled once committed', () => {
    render(<Controlled disabled />)

    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
