import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCodebase } from '../hooks/useCodebase'
import { buildFileTree } from '../lib/fileTree'
import { languageForPath } from '../lib/language'
import { FileTree } from '../components/FileTree'
import { LazyCodeEditor } from '../components/LazyCodeEditor'
import { TextLink } from '../components/TextLink'

/**
 * Read-only browser for the active task's codebase, shown as a panel tab.
 * The open file lives in `?file=` so refreshes and deep links keep it. A link without `?file=`,
 * such as the tab, reopens the file the player last had open.
 */
export default function CodebaseExplorerPage() {
  const { files, focusFiles, openFile, current, isLoading, error, noActiveTask } = useCodebase()
  const [searchParams, setSearchParams] = useSearchParams()
  const tree = useMemo(() => buildFileTree(files), [files])
  const fileParam = searchParams.get('file')
  const [lastFile, setLastFile] = useState<string | null>(null)
  // Other tabs' URLs have no `file`, so this only follows the explorer's own selection.
  if (fileParam && fileParam !== lastFile) setLastFile(fileParam)

  // A new task can remove the remembered file, so anything from before must still be in the list.
  const selectedPath =
    [fileParam, lastFile].find((path) => path && files.includes(path)) ??
    focusFiles[0] ??
    files[0] ??
    null

  useEffect(() => {
    if (selectedPath) void openFile(selectedPath)
  }, [selectedPath, openFile])

  // Effects don't run while hidden, so this can't touch another tab's URL.
  // Keeps the URL naming the open file, so a refresh after a restore shows the same file.
  useEffect(() => {
    if (selectedPath && selectedPath !== fileParam) {
      setSearchParams({ file: selectedPath }, { replace: true })
    }
  }, [selectedPath, fileParam, setSearchParams])

  if (isLoading || noActiveTask) {
    return (
      <div className="p-6">
        {isLoading ? (
          <p className="text-text-muted">Loading codebase…</p>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-text-primary">
              There's no codebase to explore until you have a task.
            </p>
            <TextLink to="/room/task">Go to the task board</TextLink>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-6 border-b border-border px-6 py-2">
        <TextLink to="/room/task">Task board</TextLink>
        <span className="ml-auto text-xs text-text-muted">Read-only</span>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 overflow-auto border-r border-border bg-bg-base p-3">
          <FileTree
            nodes={tree}
            selectedPath={selectedPath}
            focusFiles={focusFiles}
            onSelect={(path) => setSearchParams({ file: path })}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col" aria-label="File content">
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
        </section>
      </div>
    </>
  )
}
