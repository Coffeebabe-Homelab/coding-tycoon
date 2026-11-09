import { useLayoutEffect, useRef, useState } from 'react'
import Editor, { loader, type OnMount } from '@monaco-editor/react'
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
const FONT_SIZE = 13
const LINE_HEIGHT = 20

const SYNTAX_TOKENS: Record<string, string> = {
  keyword: '--color-accent-hover',
  type: '--color-info',
  annotation: '--color-warning',
  string: '--color-success',
  comment: '--color-text-muted',
}

/** Reads a design token from tokens.css so the editor follows the app theme. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function defineTheme(): void {
  const colors: Record<string, string> = {
    'editor.background': token('--color-bg-base'),
    'editor.foreground': token('--color-text-primary'),
    'editor.lineHighlightBackground': token('--color-bg-elevated'),
    'editor.selectionBackground': token('--color-accent-subtle'),
    'editorLineNumber.foreground': token('--color-text-muted'),
    'editorLineNumber.activeForeground': token('--color-text-primary'),
    'editorCursor.foreground': token('--color-accent'),
  }
  // Skip tokens that aren't emitted so Monaco keeps its vs-dark default for them.
  const definedColors = Object.fromEntries(Object.entries(colors).filter(([, value]) => value))
  // Monaco rejects a leading # in rule colours, unlike the colours map above.
  const rules = Object.entries(SYNTAX_TOKENS)
    .map(([name, cssVar]) => ({ token: name, foreground: token(cssVar).replace('#', '') }))
    .filter((rule) => rule.foreground)
  monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules,
    colors: definedColors,
  })
}

/** Monaco caches glyph widths: measured with a fallback font, the selection drifts from the text. */
function remeasureOnceFontLoads(): void {
  void document.fonts
    .load(`${FONT_SIZE}px "JetBrains Mono Variable"`)
    .then(() => monaco.editor.remeasureFonts())
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
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const savedView = useRef<monaco.editor.ICodeEditorViewState | null>(null)
  const [editorKey, setEditorKey] = useState(0)

  // Hiding a tab runs effect cleanups. The Monaco wrapper then destroys its editor and crashes if
  // shown again, so save the view first (layout cleanups run before the wrapper's) and replace it.
  useLayoutEffect(
    () => () => {
      if (editorRef.current) savedView.current = editorRef.current.saveViewState()
      editorRef.current = null
      setEditorKey((key) => key + 1)
    },
    [],
  )

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor
    if (savedView.current) editor.restoreViewState(savedView.current)
    remeasureOnceFontLoads()
  }

  return (
    <div className="h-full w-full" aria-label={ariaLabel} role="region">
      <Editor
        key={editorKey}
        height="100%"
        language={language}
        value={value}
        theme={THEME_NAME}
        beforeMount={defineTheme}
        onMount={handleMount}
        onChange={(next) => onChange?.(next ?? '')}
        options={{
          readOnly,
          domReadOnly: readOnly,
          ariaLabel,
          minimap: { enabled: false },
          fontFamily: token('--font-mono'),
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  )
}
