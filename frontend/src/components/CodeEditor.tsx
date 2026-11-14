import { useLayoutEffect, useRef, useState } from 'react'
import Editor, { DiffEditor, loader, type DiffOnMount, type OnMount } from '@monaco-editor/react'
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
    'diffEditor.insertedLineBackground': token('--color-success-subtle'),
    'diffEditor.removedLineBackground': token('--color-danger-subtle'),
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

/**
 * Hiding a tab runs effect cleanups. The Monaco wrappers then destroy their editor and crash if
 * shown again, so this returns a key that replaces the editor after each hide. `onHide` runs
 * first: layout cleanups run before the wrapper's, while the old editor still exists.
 */
function useEditorKeyAcrossHide(onHide?: () => void): number {
  const [editorKey, setEditorKey] = useState(0)
  const onHideRef = useRef(onHide)
  useLayoutEffect(() => {
    onHideRef.current = onHide
  })
  useLayoutEffect(
    () => () => {
      onHideRef.current?.()
      setEditorKey((key) => key + 1)
    },
    [],
  )
  return editorKey
}

/**
 * A new editor reuses a kept model as it is: the wrapper only applies `value` on later changes.
 * Setting it only when stale keeps the model's undo history.
 */
function syncModel(model: { getValue(): string; setValue(value: string): void }, value: string) {
  if (model.getValue() !== value) model.setValue(value)
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
  /** Monaco model URI. Give each editable file its own so undo history stays per file. */
  path?: string
  /** 1-based line and column, for a status bar. Read once per editor mount, so pass a stable function. */
  onCursorChange?: (line: number, column: number) => void
  ariaLabel: string
}

/**
 * Shared Monaco editor: read-only in the Codebase Explorer, editable in the Phase 4 editor.
 * Load it through `LazyCodeEditor` so Monaco stays out of the initial bundle.
 */
export function CodeEditor({
  value,
  language,
  readOnly,
  onChange,
  path,
  onCursorChange,
  ariaLabel,
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const savedView = useRef<monaco.editor.ICodeEditorViewState | null>(null)
  const editorKey = useEditorKeyAcrossHide(() => {
    if (editorRef.current) savedView.current = editorRef.current.saveViewState()
    editorRef.current = null
  })

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor
    syncModel(editor, value)
    if (savedView.current) editor.restoreViewState(savedView.current)
    const position = editor.getPosition()
    if (position) onCursorChange?.(position.lineNumber, position.column)
    editor.onDidChangeCursorPosition(({ position }) =>
      onCursorChange?.(position.lineNumber, position.column),
    )
    remeasureOnceFontLoads()
  }

  return (
    <div className="h-full w-full" aria-label={ariaLabel} role="region">
      <Editor
        key={editorKey}
        height="100%"
        language={language}
        value={value}
        path={path}
        // Hiding a tab replaces the editor; keeping named models keeps each file's undo history.
        // Unnamed models get a fresh URI per editor, so keeping them would only leak.
        keepCurrentModel={path !== undefined}
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

export interface CodeDiffProps {
  original: string
  modified: string
  /** Monaco language id, see `languageForPath` in lib/language.ts. */
  language: string
  /** The file's path; each file gets its own pair of models. */
  path: string
  /** Side by side when true, one unified column otherwise. */
  split: boolean
  /** Lines added and removed, each time Monaco finishes a diff. Read once per mount. */
  onLineCounts?: (added: number, removed: number) => void
  ariaLabel: string
}

/** Counts lines from Monaco's line changes; an end line of 0 means "no lines on that side". */
function countLines(changes: monaco.editor.ILineChange[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const change of changes) {
    if (change.modifiedEndLineNumber > 0) {
      added += change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1
    }
    if (change.originalEndLineNumber > 0) {
      removed += change.originalEndLineNumber - change.originalStartLineNumber + 1
    }
  }
  return { added, removed }
}

/**
 * Read-only Monaco diff of a file's original and the player's version, for the VCS panel.
 * Load it through `DiffView`. One editor whose models swap per file, as the spec asks.
 */
export function CodeDiff({
  original,
  modified,
  language,
  path,
  split,
  onLineCounts,
  ariaLabel,
}: CodeDiffProps) {
  const editorKey = useEditorKeyAcrossHide()

  const handleMount: DiffOnMount = (editor) => {
    const models = editor.getModel()
    if (models) {
      syncModel(models.original, original)
      syncModel(models.modified, modified)
    }
    editor.onDidUpdateDiff(() => {
      const { added, removed } = countLines(editor.getLineChanges() ?? [])
      onLineCounts?.(added, removed)
    })
    remeasureOnceFontLoads()
  }

  return (
    <div className="h-full w-full" aria-label={ariaLabel} role="region">
      <DiffEditor
        key={editorKey}
        height="100%"
        language={language}
        original={original}
        modified={modified}
        originalModelPath={`diff-original/${path}`}
        modifiedModelPath={`diff-modified/${path}`}
        // Disposing the models before the editor makes Monaco's diff widget throw. One pair per
        // file path is kept, so this stays bounded by the task's focus files.
        keepCurrentOriginalModel
        keepCurrentModifiedModel
        theme={THEME_NAME}
        beforeMount={defineTheme}
        onMount={handleMount}
        options={{
          readOnly: true,
          domReadOnly: true,
          originalEditable: false,
          renderSideBySide: split,
          // Keep the toggle meaningful: Monaco would otherwise fall back to unified when narrow.
          useInlineViewWhenSpaceIsLimited: false,
          ariaLabel,
          minimap: { enabled: false },
          fontFamily: token('--font-mono'),
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  )
}
