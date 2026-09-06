interface TopicChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

/**
 * A toggleable chip used to select topics in the onboarding wizard and profile editor.
 * Selected chips use the accent-subtle background; unselected chips use bg-elevated.
 */
export function TopicChip({ label, selected, onClick }: TopicChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-accent ${
        selected
          ? 'bg-accent-subtle text-accent-hover'
          : 'bg-bg-elevated text-text-muted'
      }`}
    >
      {label}
    </button>
  )
}
