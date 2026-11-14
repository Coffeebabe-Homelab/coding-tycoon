import { Icon } from './Icon'

interface CriteriaItemProps {
  text: string
  done?: boolean
}

/**
 * Figma Criteria Item (9:273). The box shows state only: nothing decides yet when a criterion is
 * met (Phase 5 review does), so it is not an input. Render inside a `<ul>`.
 */
export function CriteriaItem({ text, done = false }: CriteriaItemProps) {
  return (
    <li className="flex items-start gap-2 py-1">
      <span
        aria-hidden="true"
        className={`flex size-5 shrink-0 items-center justify-center rounded-sm border ${
          done ? 'border-success bg-success-subtle text-success' : 'border-border-strong'
        }`}
      >
        {done && <Icon name="check" />}
      </span>
      <span className="text-sm text-text-muted">
        {text}
        {done && <span className="sr-only"> (done)</span>}
      </span>
    </li>
  )
}
