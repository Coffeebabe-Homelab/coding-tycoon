import { Suspense, lazy } from 'react'
import type { CodeEditorProps } from './CodeEditor'

// Monaco is several MB; loading it on demand keeps it out of the initial bundle.
const CodeEditor = lazy(() =>
  import('./CodeEditor').then((module) => ({ default: module.CodeEditor })),
)

/** `CodeEditor` loaded on first render, with the app's standard loading message meanwhile. */
export function LazyCodeEditor(props: CodeEditorProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-text-muted">Loading editor…</p>
        </div>
      }
    >
      <CodeEditor {...props} />
    </Suspense>
  )
}
