import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppBar } from './AppBar'
import type { Progress } from '../types/progress'

const PROGRESS: Progress = {
  level: 'X',
  totalXp: 1240,
  xpToday: 100,
  currentStreak: 4,
  longestStreak: 9,
  approvedTodayTaskTitle: null,
}

function renderBar(props: Partial<Parameters<typeof AppBar>[0]> = {}) {
  const onLogout = vi.fn()
  render(
    <MemoryRouter>
      <AppBar email="player@example.com" progress={PROGRESS} onLogout={onLogout} {...props} />
    </MemoryRouter>,
  )
  return onLogout
}

const breadcrumb = () => screen.getByRole('navigation', { name: 'Breadcrumb' })

describe('AppBar', () => {
  it('shows the level with the total XP, and the streak', () => {
    renderBar()

    expect(screen.getByText('LV X · 1,240 XP')).toBeInTheDocument()
    expect(screen.getByText('4-day streak')).toBeInTheDocument()
  })

  it('hides the stats when progress is missing', () => {
    renderBar({ progress: null })

    expect(screen.queryByText(/XP/)).not.toBeInTheDocument()
    expect(screen.queryByText(/streak/)).not.toBeInTheDocument()
  })

  it('shows only Room in the breadcrumb with no panel open', () => {
    renderBar()

    expect(breadcrumb()).toHaveTextContent(/^Room$/)
  })

  it('names the open panel in the breadcrumb, and links back to the room', () => {
    renderBar({ panelLabel: 'Task Board' })

    expect(breadcrumb()).toHaveTextContent('Room / Task Board')
    expect(screen.getByRole('link', { name: 'Room' })).toHaveAttribute('href', '/room')
  })

  it('offers the wrap-up link only after an approval today', () => {
    renderBar({ progress: { ...PROGRESS, approvedTodayTaskTitle: 'Add endpoint' } })

    expect(screen.getByRole('link', { name: /wrap up the day/ })).toHaveAttribute(
      'href',
      '/room/end-of-day',
    )
  })

  it('has no wrap-up link before an approval', () => {
    renderBar()

    expect(screen.queryByRole('link', { name: /wrap up the day/ })).not.toBeInTheDocument()
  })

  it('reaches the profile and logs out through the avatar menu', async () => {
    const onLogout = renderBar()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Account menu' }))

    expect(screen.getByText('player@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile')
    await user.click(screen.getByRole('button', { name: 'Log out' }))
    expect(onLogout).toHaveBeenCalledOnce()
  })
})
