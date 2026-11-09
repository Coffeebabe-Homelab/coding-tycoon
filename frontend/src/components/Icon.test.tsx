import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Icon, type IconName } from './Icon'

const NAMES: IconName[] = ['x', 'check', 'lock', 'arrow-left', 'branch', 'commit', 'flame', 'user']

describe('Icon', () => {
  it.each(NAMES)('draws %s on the 16px grid', (name) => {
    const { container } = render(<Icon name={name} />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 16 16')
    expect(svg).toHaveAttribute('width', '16')
    expect(svg?.querySelector('path')).toBeInTheDocument()
  })

  it('is hidden from screen readers by default', () => {
    const { container } = render(<Icon name="x" />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('can be exposed with a label', () => {
    const { getByRole } = render(
      <Icon name="lock" role="img" aria-hidden={false} aria-label="Locked" />,
    )

    expect(getByRole('img', { name: 'Locked' })).toBeInTheDocument()
  })
})
