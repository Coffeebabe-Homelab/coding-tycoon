import type { KeyboardEvent, Ref } from 'react'
import { Icon } from './Icon'

interface EditorTabProps {
  path: string
  active: boolean
  readOnly: boolean
  panelId: string
  onSelect: () => void
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void
  ref?: Ref<HTMLButtonElement>
}

/**
 * Figma Editor Tab (8:166): one open file. Use inside a `role="tablist"`; only the active tab is
 * in the Tab order, the list moves between tabs with the arrow keys. Focus files can't be closed,
 * so the trailing slot only shows the lock of a read-only file.
 */
export function EditorTab({
  path,
  active,
  readOnly,
  panelId,
  onSelect,
  onKeyDown,
  ref,
}: EditorTabProps) {
  const fileName = path.slice(path.lastIndexOf('/') + 1)
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      title={path}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`flex items-center gap-2 border-t-2 px-3 py-2 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
        active
          ? 'border-accent bg-bg-base text-text-primary'
          : 'border-transparent bg-bg-surface text-text-muted hover:text-text-primary'
      }`}
    >
      {fileName}
      {readOnly && (
        <>
          <Icon name="lock" className="text-text-muted" />
          <span className="sr-only"> (read-only)</span>
        </>
      )}
    </button>
  )
}
