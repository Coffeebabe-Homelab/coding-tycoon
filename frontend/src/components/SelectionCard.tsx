interface SelectionCardProps {
  label: string
  selected: boolean
  onClick: () => void
}

/**
 * A single-select card used in the onboarding wizard and profile editor.
 * Renders a styled button that highlights when selected.
 * Add more options by rendering more SelectionCard instances — no code changes needed.
 */
export function SelectionCard({ label, selected, onClick }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-6 py-3 text-sm font-medium transition-colors hover:border-accent ${
        selected
          ? 'border-accent bg-accent-subtle text-text-primary'
          : 'border-border bg-bg-elevated text-text-muted'
      }`}
    >
      {label}
    </button>
  )
}
