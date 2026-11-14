import { useId } from 'react'

interface InputProps {
  label: string
  value: string
  onChange: (value: string) => void
  /** Text under the field, such as a character count; read out as the field's description. */
  helper?: string
  maxLength?: number
  disabled?: boolean
  rows?: number
}

/**
 * Figma Input (8:55): label above, helper below, disabled once the value is committed.
 * Multi-line only for now, because the commit message is its first user.
 */
export function Input({
  label,
  value,
  onChange,
  helper,
  maxLength,
  disabled = false,
  rows = 3,
}: InputProps) {
  const id = useId()
  const helperId = useId()
  return (
    <div className={`flex flex-col gap-2 ${disabled ? 'opacity-40' : ''}`}>
      <label htmlFor={id} className="text-label-s text-text-muted">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        disabled={disabled}
        rows={rows}
        aria-describedby={helper ? helperId : undefined}
        className="resize-none rounded-md border border-border-input bg-bg-elevated px-3 py-2 text-sm text-text-primary focus-visible:border-accent disabled:border-border"
      />
      {helper && (
        <p id={helperId} className="text-label-s text-text-muted">
          {helper}
        </p>
      )}
    </div>
  )
}
