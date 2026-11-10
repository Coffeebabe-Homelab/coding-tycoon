import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Hotspot } from './Hotspot'

function renderHotspot(onActivate?: () => void) {
  render(
    <svg>
      <Hotspot label="Door" onActivate={onActivate}>
        <circle />
      </Hotspot>
    </svg>,
  )
  return { user: userEvent.setup(), hotspot: screen.getByRole('button', { name: 'Door' }) }
}

describe('Hotspot', () => {
  it('activates on click', async () => {
    const onActivate = vi.fn()
    const { user, hotspot } = renderHotspot(onActivate)

    await user.click(hotspot)

    expect(onActivate).toHaveBeenCalledOnce()
  })

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('activates with %s once it has keyboard focus', async (_name, key) => {
    const onActivate = vi.fn()
    const { user, hotspot } = renderHotspot(onActivate)

    await user.tab()
    expect(hotspot).toHaveFocus()
    await user.keyboard(key)

    expect(onActivate).toHaveBeenCalledOnce()
  })

  it('ignores other keys', async () => {
    const onActivate = vi.fn()
    const { user } = renderHotspot(onActivate)

    await user.tab()
    await user.keyboard('a')

    expect(onActivate).not.toHaveBeenCalled()
  })

  // Focus returns here when a panel closes; the default outline would box the whole slanted object.
  it.each([
    ['enabled', vi.fn()],
    ['disabled', undefined],
  ])('shows focus with its glow, not the outline, when %s', (_name, onActivate) => {
    const { hotspot } = renderHotspot(onActivate)

    expect(hotspot).toHaveClass('outline-none')
  })

  it('without an action it stays focusable and is announced as disabled', async () => {
    const { user, hotspot } = renderHotspot()

    await user.tab()
    await user.keyboard('{Enter}')

    expect(hotspot).toHaveFocus()
    expect(hotspot).toHaveAttribute('aria-disabled', 'true')
  })
})
