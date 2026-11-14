import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast, type ToastMessage } from './useToast'

function Trigger({ toast }: { toast: ToastMessage }) {
  const { showToast } = useToast()
  return <button onClick={() => showToast(toast)}>show</button>
}

function renderWith(toast: ToastMessage) {
  render(
    <ToastProvider>
      <Trigger toast={toast} />
    </ToastProvider>,
  )
}

const SUCCESS: ToastMessage = { tone: 'success', title: 'Pushed', message: 'Waiting for review' }

describe('useToast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('announces a success politely and hides it after a few seconds', () => {
    vi.useFakeTimers()
    renderWith(SUCCESS)

    act(() => screen.getByRole('button', { name: 'show' }).click())
    expect(screen.getByRole('status')).toHaveTextContent('PushedWaiting for review')

    act(() => vi.advanceTimersByTime(6000))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps an error until the player dismisses it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderWith({ tone: 'error', title: 'Push failed', message: 'Try again' })

    act(() => screen.getByRole('button', { name: 'show' }).click())
    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByRole('alert')).toHaveTextContent('Push failed')

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows one toast at a time, the newest', () => {
    vi.useFakeTimers()
    renderWith(SUCCESS)

    act(() => screen.getByRole('button', { name: 'show' }).click())
    act(() => vi.advanceTimersByTime(5000))
    act(() => screen.getByRole('button', { name: 'show' }).click())
    act(() => vi.advanceTimersByTime(5000))

    // The second toast restarted the timer, so it is still showing.
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Trigger toast={SUCCESS} />)).toThrow('ToastProvider')
  })
})
