import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/language/json/json.worker?worker'

// All Monaco wiring lives in this file so upgrading or swapping the editor touches one place.

// Workers are bundled by Vite, so nothing is fetched from a CDN at runtime.
self.MonacoEnvironment = {
  getWorker: (_workerId: string, label: string) =>
    label === 'json' ? new JsonWorker() : new EditorWorker(),
}

// Without this, @monaco-editor/react downloads Monaco from jsDelivr.
loader.config({ monaco })

const THEME_NAME = 'coding-tycoon-dark'

/** Reads a design token from tokens.css so the editor follows the app theme. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function defineTheme(): void {
  const colors: Record<string, string> = {
    'editor.background': token('--color-bg-surface'),
    'editor.foreground': token('--color-text-primary'),
    'editor.lineHighlightBackground': token('--color-bg-elevated'),
    'editor.selectionBackground': token('--color-accent-subtle'),
    'editorLineNumber.foreground': token('--color-text-muted'),
    'editorLineNumber.activeForeground': token('--color-text-primary'),
    'editorCursor.foreground': token('--color-accent-hover'),
  }
  // Skip tokens that aren't emitted so Monaco keeps its vs-dark default for them.
  const definedColors = Object.fromEntries(Object.entries(colors).filter(([, value]) => value))
  monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: definedColors,
  })
}

export interface CodeEditorProps {
  value: string
  /** Monaco language id, see `languageForPath` in lib/language.ts. */
  language: string
  readOnly: boolean
  onChange?: (value: string) => void
  ariaLabel: string
}

/**
 * Shared Monaco editor: read-only in the Codebase Explorer, editable in the Phase 4 editor.
 * Load it through `LazyCodeEditor` so Monaco stays out of the initial bundle.
 */
export function CodeEditor({ value, language, readOnly, onChange, ariaLabel }: CodeEditorProps) {
  return (
    <div className="h-full w-full" aria-label={ariaLabel} role="region">
      <Editor
        height="100%"
        language={language}
        value={value}
        theme={THEME_NAME}
        beforeMount={defineTheme}
        onChange={(next) => onChange?.(next ?? '')}
        options={{
          readOnly,
          domReadOnly: readOnly,
          ariaLabel,
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  )
}
