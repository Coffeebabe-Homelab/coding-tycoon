import { Suspense, lazy } from 'react'
import type { CodeDiffProps } from './CodeEditor'

// Same chunk as the editor: Monaco is several MB and stays out of the initial bundle.
const CodeDiff = lazy(() => import('./CodeEditor').then((module) => ({ default: module.CodeDiff })))

/** `CodeDiff` loaded on first render, with a loading message meanwhile. */
export function DiffView(props: CodeDiffProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-text-muted">Loading diff…</p>
        </div>
      }
    >
      <CodeDiff {...props} />
    </Suspense>
  )
}
