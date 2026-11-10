import { Icon } from './Icon'

export type StepperStepState = 'done' | 'current' | 'upcoming'

interface StepperStepProps {
  state: StepperStepState
  number: number
  label: string
}

const DOT_CLASSES: Record<StepperStepState, string> = {
  done: 'border border-success bg-success-subtle text-success',
  current: 'bg-accent text-accent-ink',
  upcoming: 'border border-border-strong text-text-muted',
}

/** Figma Stepper Step (10:145). A list item: render inside an <ol>. */
export function StepperStep({ state, number, label }: StepperStepProps) {
  return (
    <li aria-current={state === 'current' ? 'step' : undefined} className="flex items-center gap-2">
      <span
        className={`flex size-6 items-center justify-center rounded-full text-label-s ${DOT_CLASSES[state]}`}
      >
        {state === 'done' ? <Icon name="check" /> : number}
      </span>
      <span
        className={`text-label-m ${state === 'upcoming' ? 'text-text-muted' : 'text-text-primary'}`}
      >
        {state === 'done' && <span className="sr-only">Done: </span>}
        {label}
      </span>
    </li>
  )
}
