import { Icon } from './Icon'

export type SelectionCardType = 'default' | 'selected' | 'selected-locked' | 'coming-soon'

interface SelectionCardProps {
  type: SelectionCardType
  label: string
  caption?: string
  onClick?: () => void
}

const SELECTED_CLASSES = 'border-2 border-accent bg-accent-subtle'
const UNSELECTED_CLASSES = 'border border-border bg-bg-elevated'

const CARD_CLASSES: Record<SelectionCardType, string> = {
  default: `${UNSELECTED_CLASSES} hover:border-accent`,
  selected: SELECTED_CLASSES,
  'selected-locked': SELECTED_CLASSES,
  'coming-soon': `${UNSELECTED_CLASSES} opacity-60`,
}

/** Figma Selection Card (10:127): one option in a single-choice group. */
export function SelectionCard({ type, label, caption, onClick }: SelectionCardProps) {
  const isSelected = type === 'selected' || type === 'selected-locked'
  const isFixed = type === 'selected-locked' || type === 'coming-soon'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isFixed}
      aria-pressed={isSelected}
      className={`flex w-50 min-w-0 flex-col gap-1 rounded-lg p-4 text-left transition-colors disabled:cursor-not-allowed ${CARD_CLASSES[type]}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={`text-h3 ${isSelected ? 'text-text-primary' : 'text-text-muted'}`}>
          {label}
        </span>
        {isFixed && <Icon name="lock" className="shrink-0 text-text-muted" />}
        {type === 'selected' && <Icon name="check" className="shrink-0 text-success" />}
      </span>
      {caption && (
        <span
          className={`text-label-s ${isSelected ? 'text-accent-on-subtle' : 'text-text-muted'}`}
        >
          {caption}
        </span>
      )}
    </button>
  )
}
