import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StepperStep } from './StepperStep'

function renderStep(state: 'done' | 'current' | 'upcoming') {
  render(
    <ol>
      <StepperStep state={state} number={2} label="Level" />
    </ol>,
  )
  return screen.getByRole('listitem')
}

describe('StepperStep', () => {
  it('marks only the current step for screen readers', () => {
    expect(renderStep('current')).toHaveAttribute('aria-current', 'step')
  })

  it('shows the number on the current and upcoming steps', () => {
    const step = renderStep('upcoming')

    expect(step).not.toHaveAttribute('aria-current')
    expect(step).toHaveTextContent('2Level')
  })

  it('replaces the number with a check on a done step, and says so', () => {
    const step = renderStep('done')

    expect(step).not.toHaveAttribute('aria-current')
    expect(step).toHaveTextContent(/^Done: Level$/)
    expect(step.querySelector('svg')).toBeInTheDocument()
  })
})
