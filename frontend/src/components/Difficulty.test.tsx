import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Difficulty } from './Difficulty'

describe('Difficulty', () => {
  it.each([
    ['Easy', 'text-success'],
    ['Medium', 'text-warning'],
    ['Hard', 'text-danger'],
  ])('shows %s in its colour', (level, colour) => {
    render(<Difficulty level={level} />)

    expect(screen.getByText(level)).toHaveClass(colour)
  })

  it('matches the API value in any case', () => {
    render(<Difficulty level="hARD" />)

    expect(screen.getByText('hARD')).toHaveClass('text-danger')
  })

  it('uses a neutral style for an unknown value', () => {
    render(<Difficulty level="constructor" />)

    expect(screen.getByText('constructor')).toHaveClass('text-text-muted')
  })
})
