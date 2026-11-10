import { Icon } from './Icon'

interface ChipProps {
  label: string
  selected?: boolean
  /** Makes the chip a toggle. Without it the chip is a read-only tag. */
  onClick?: () => void
}

const BASE_CLASSES = 'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-label-m'
const SELECTED_CLASSES = 'border-accent bg-accent-subtle text-accent-on-subtle'
const UNSELECTED_CLASSES = 'border-border bg-bg-elevated text-text-muted'

/** Figma Chip (8:77), Unselected and Selected types. */
export function Chip({ label, selected = false, onClick }: ChipProps) {
  const classes = `${BASE_CLASSES} ${selected ? SELECTED_CLASSES : UNSELECTED_CLASSES}`
  const content = (
    <>
      {selected && <Icon name="check" className="text-success" />}
      {label}
    </>
  )

  if (!onClick) return <span className={classes}>{content}</span>

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      // Figma draws 30px; Design Spec § 10 sets 32px for interactive chips.
      className={`${classes} min-h-8 transition-colors hover:border-accent`}
    >
      {content}
    </button>
  )
}
