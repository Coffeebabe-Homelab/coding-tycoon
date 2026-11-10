import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AvatarMenu } from './AvatarMenu'
import { LocationProbe } from '../test/LocationProbe'

function renderMenu() {
  const onLogout = vi.fn()
  render(
    <MemoryRouter initialEntries={['/room']}>
      <LocationProbe />
      <AvatarMenu email="player@example.com" onLogout={onLogout} />
      <button>elsewhere</button>
    </MemoryRouter>,
  )
  return { user: userEvent.setup(), onLogout }
}

const avatar = () => screen.getByRole('button', { name: 'Account menu' })
const profile = () => screen.getByRole('link', { name: 'Profile' })
const logOut = () => screen.getByRole('button', { name: 'Log out' })
const email = () => screen.queryByText('player@example.com')

describe('AvatarMenu', () => {
  it('starts closed', () => {
    renderMenu()

    expect(avatar()).toHaveAttribute('aria-expanded', 'false')
    expect(email()).not.toBeInTheDocument()
  })

  it('opens and closes from the avatar', async () => {
    const { user } = renderMenu()

    await user.click(avatar())
    expect(avatar()).toHaveAttribute('aria-expanded', 'true')
    expect(email()).toBeInTheDocument()

    await user.click(avatar())
    expect(email()).not.toBeInTheDocument()
  })

  it.each(['{Enter}', ' '])('opens from the keyboard with %s', async (key) => {
    const { user } = renderMenu()

    avatar().focus()
    await user.keyboard(key)

    expect(email()).toBeInTheDocument()
  })

  it('reaches each item with Tab', async () => {
    const { user } = renderMenu()
    await user.click(avatar())

    await user.tab()
    expect(profile()).toHaveFocus()
    await user.tab()
    expect(logOut()).toHaveFocus()
  })

  it('closes on Escape and returns focus to the avatar', async () => {
    const { user } = renderMenu()
    await user.click(avatar())
    await user.tab()

    await user.keyboard('{Escape}')

    expect(email()).not.toBeInTheDocument()
    expect(avatar()).toHaveFocus()
  })

  it('ignores other keys', async () => {
    const { user } = renderMenu()
    await user.click(avatar())

    await user.keyboard('a')

    expect(email()).toBeInTheDocument()
  })

  it('closes on a click outside, leaving focus alone', async () => {
    const { user } = renderMenu()
    await user.click(avatar())

    await user.click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(email()).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'elsewhere' })).toHaveFocus()
  })

  it('stays open on a click inside', async () => {
    const { user } = renderMenu()
    await user.click(avatar())

    await user.click(email() as HTMLElement)

    expect(email()).toBeInTheDocument()
  })

  it('closes when Tab leaves it', async () => {
    const { user } = renderMenu()
    await user.click(avatar())

    await user.tab()
    await user.tab()
    await user.tab()

    expect(email()).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'elsewhere' })).toHaveFocus()
  })

  it('goes to the profile and closes', async () => {
    const { user } = renderMenu()
    await user.click(avatar())

    await user.click(profile())

    expect(screen.getByTestId('location')).toHaveTextContent('/profile')
    expect(email()).not.toBeInTheDocument()
  })

  it('logs out', async () => {
    const { user, onLogout } = renderMenu()
    await user.click(avatar())

    await user.click(logOut())

    expect(onLogout).toHaveBeenCalledOnce()
  })
})
