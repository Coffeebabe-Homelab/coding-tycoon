import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCodebase } from '../hooks/useCodebase'
import { buildFileTree } from '../lib/fileTree'
import { languageForPath } from '../lib/language'
import { FileTree } from '../components/FileTree'
import { LazyCodeEditor } from '../components/LazyCodeEditor'
import { LoadingScreen } from '../components/LoadingScreen'
import { TextLink } from '../components/TextLink'

/**
 * Read-only browser for the active task's codebase.
 * The open file lives in `?file=` so refreshes, deep links and the back button keep it.
 */
export default function CodebaseExplorerPage() {
  const { files, focusFiles, openFile, current, isLoading, error, noActiveTask } = useCodebase()
  const [searchParams, setSearchParams] = useSearchParams()
  const tree = useMemo(() => buildFileTree(files), [files])
  const selectedPath = searchParams.get('file') ?? focusFiles[0] ?? files[0] ?? null

  useEffect(() => {
    if (selectedPath) void openFile(selectedPath)
  }, [selectedPath, openFile])

  if (isLoading) return <LoadingScreen message="Loading codebase…" />

  if (noActiveTask) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base">
        <p className="text-text-primary">There's no codebase to explore until you have a task.</p>
        <TextLink to="/room/task">Go to the task board</TextLink>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-bg-base">
      <header className="flex items-center gap-6 border-b border-border px-6 py-3">
        <TextLink to="/room">← Back to room</TextLink>
        <TextLink to="/room/task">Task board</TextLink>
        <span className="ml-auto text-xs text-text-muted">Read-only</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 overflow-auto border-r border-border bg-bg-surface p-3">
          <FileTree
            nodes={tree}
            selectedPath={selectedPath}
            focusFiles={focusFiles}
            onSelect={(path) => setSearchParams({ file: path })}
          />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <p className="border-b border-border px-4 py-2 font-mono text-sm text-text-muted">
            {current?.path ?? selectedPath}
          </p>
          {error && <p className="px-4 py-2 text-danger">{error}</p>}
          <div className="min-h-0 flex-1">
            {current && (
              <LazyCodeEditor
                value={current.content}
                language={languageForPath(current.path)}
                readOnly
                ariaLabel={`Read-only view of ${current.path}`}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
