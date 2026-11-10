import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SelectionCard, type SelectionCardType } from './SelectionCard'

function renderCard(type: SelectionCardType) {
  const onClick = vi.fn()
  render(<SelectionCard type={type} label="Java" caption="Only option in MVP" onClick={onClick} />)
  return { onClick, card: screen.getByRole('button', { name: /Java/ }) }
}

describe('SelectionCard', () => {
  it.each<SelectionCardType>(['default', 'selected'])('%s fires on click', async (type) => {
    const { card, onClick } = renderCard(type)

    await userEvent.click(card)

    expect(onClick).toHaveBeenCalledOnce()
  })

  it.each<SelectionCardType>(['selected-locked', 'coming-soon'])(
    '%s cannot be clicked',
    async (type) => {
      const { card, onClick } = renderCard(type)

      await userEvent.click(card)

      expect(card).toBeDisabled()
      expect(onClick).not.toHaveBeenCalled()
    },
  )

  it.each<[SelectionCardType, boolean]>([
    ['default', false],
    ['selected', true],
    ['selected-locked', true],
    ['coming-soon', false],
  ])('%s exposes pressed=%s', (type, pressed) => {
    expect(renderCard(type).card).toHaveAttribute('aria-pressed', String(pressed))
  })

  it('includes the caption in the name', () => {
    expect(renderCard('default').card).toHaveAccessibleName(/^Java\s*Only option in MVP$/)
  })

  it('leaves the caption out when there is none', () => {
    render(<SelectionCard type="default" label="Junior" onClick={() => {}} />)

    expect(screen.getByRole('button')).toHaveAccessibleName('Junior')
  })

  it.each<[SelectionCardType, number]>([
    ['default', 0],
    ['selected', 1],
    ['selected-locked', 1],
    ['coming-soon', 1],
  ])('%s shows %i status icons', (type, icons) => {
    expect(renderCard(type).card.querySelectorAll('svg')).toHaveLength(icons)
  })
})
