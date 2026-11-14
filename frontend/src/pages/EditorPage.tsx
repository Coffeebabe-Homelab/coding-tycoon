import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDrafts } from '../hooks/useDrafts'
import { useTask } from '../hooks/useTask'
import { splitCriteria } from '../lib/criteria'
import { languageForPath, languageLabel } from '../lib/language'
import { Button } from '../components/Button'
import { buttonClasses } from '../components/buttonClasses'
import { CriteriaItem } from '../components/CriteriaItem'
import { Difficulty } from '../components/Difficulty'
import { EditorTab } from '../components/EditorTab'
import { LazyCodeEditor } from '../components/LazyCodeEditor'
import { Modal } from '../components/Modal'
import { StatusBadge } from '../components/StatusBadge'
import { TextLink } from '../components/TextLink'
import type { Task } from '../types/task'

// Monaco's own binding for "Tab moves focus"; on a Mac Cmd+M would minimise the window instead.
const TAB_FOCUS_SHORTCUT = /Mac/.test(navigator.userAgent) ? 'Ctrl+Shift+M' : 'Ctrl+M'

const EDITABLE_STATUSES: Task['status'][] = ['IN_PROGRESS', 'CHANGES_REQUESTED']

/** Panel tab where the player edits the active task's focus files. Drafts live in DraftsProvider. */
export default function EditorPage() {
  const { task, isLoading, error } = useTask()

  if (isLoading) return <Message>Loading today's task…</Message>
  if (error) return <p className="p-6 text-danger">{error}</p>
  if (!task || task.focusFiles.length === 0) {
    return (
      <Message>
        This task has no files to edit.
        <TextLink to="/room/codebase">Explore the codebase</TextLink>
      </Message>
    )
  }
  if (task.status === 'ASSIGNED') {
    return (
      <Message>
        Start the task to edit its files.
        <TextLink to="/room/task">Go to the task board</TextLink>
      </Message>
    )
  }
  return <Workspace task={task} />
}

function Message({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-start gap-4 p-6 text-text-primary">{children}</div>
}

function Workspace({ task }: { task: Task }) {
  const { files, changedPaths, isLoading, error, loadDrafts, setDraft, resetFile } = useDrafts()
  const [searchParams, setSearchParams] = useSearchParams()
  const fileParam = searchParams.get('file')
  // The tab link has no ?file=, so remember the last file to reopen it, as the Explorer does.
  const [lastFile, setLastFile] = useState<string | null>(null)
  if (fileParam && fileParam !== lastFile) setLastFile(fileParam)
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)
  const [cursor, setCursor] = useState({ line: 1, column: 1 })
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())
  const panelId = useId()
  const readOnly = !EDITABLE_STATUSES.includes(task.status)

  useEffect(() => loadDrafts(task), [task, loadDrafts])

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursor({ line, column })
  }, [])

  const file = files.find((candidate) => candidate.path === (fileParam ?? lastFile)) ?? files[0]
  if (isLoading || !file) {
    return <Message>{error ?? 'Loading files…'}</Message>
  }

  const isChanged = changedPaths.includes(file.path)

  const selectFile = (path: string) => {
    setSearchParams({ file: path }, { replace: true })
    tabRefs.current.get(path)?.focus()
  }

  // WAI-ARIA tabs: arrows move between files, Home and End jump to the ends.
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = files.indexOf(file)
    const next = {
      ArrowLeft: files[(index - 1 + files.length) % files.length],
      ArrowRight: files[(index + 1) % files.length],
      Home: files[0],
      End: files[files.length - 1],
    }[event.key]
    if (!next) return
    event.preventDefault()
    selectFile(next.path)
  }

  const confirmReset = () => {
    resetFile(file.path)
    setIsConfirmingReset(false)
    // Reset gets disabled, so focus would fall to <body>.
    tabRefs.current.get(file.path)?.focus()
  }

  return (
    <div className="flex min-h-0 flex-1">
      <TicketSidebar task={task} />

      <section className="flex min-w-0 flex-1 flex-col">
        <div role="tablist" aria-label="Task files" className="flex bg-bg-surface">
          {files.map((candidate) => (
            <EditorTab
              key={candidate.path}
              ref={(element) => {
                if (element) tabRefs.current.set(candidate.path, element)
                else tabRefs.current.delete(candidate.path)
              }}
              path={candidate.path}
              active={candidate === file}
              readOnly={readOnly}
              panelId={panelId}
              onSelect={() => selectFile(candidate.path)}
              onKeyDown={handleTabKeyDown}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 border-b border-border px-4 py-2">
          <p
            aria-label="File path"
            className="min-w-0 flex-1 truncate font-mono text-xs text-text-muted"
          >
            {file.path.split('/').join(' › ')}
          </p>
          {readOnly ? (
            <p className="text-sm text-text-muted">
              {task.status === 'SUBMITTED'
                ? 'Pushed and waiting for review: files are read-only.'
                : 'Files are read-only.'}
            </p>
          ) : (
            <>
              <Button
                variant="secondary"
                disabled={!isChanged}
                onClick={() => setIsConfirmingReset(true)}
              >
                Reset file
              </Button>
              {changedPaths.length > 0 ? (
                <Link to="/room/vcs" className={buttonClasses('primary')}>
                  Review changes
                </Link>
              ) : (
                <Button disabled>Review changes</Button>
              )}
            </>
          )}
        </div>

        <div id={panelId} role="tabpanel" className="min-h-0 flex-1">
          <LazyCodeEditor
            path={`draft/${file.path}`}
            value={file.draft}
            language={languageForPath(file.path)}
            readOnly={readOnly}
            onChange={(content) => setDraft(file.path, content)}
            onCursorChange={handleCursorChange}
            ariaLabel={`${readOnly ? 'Read-only' : 'Editing'} ${file.path.slice(file.path.lastIndexOf('/') + 1)}`}
          />
        </div>

        <div
          role="status"
          aria-label="Editor status"
          className="flex items-center gap-4 border-t border-border px-4 py-2 text-xs text-text-muted"
        >
          <span className="rounded-sm bg-accent-subtle px-2 py-0.5 font-semibold uppercase text-accent-on-subtle">
            {readOnly ? 'Read-only' : 'Editing'}
          </span>
          <span>{languageLabel(file.path)}</span>
          <span className="ml-auto">{TAB_FOCUS_SHORTCUT}: Tab moves focus</span>
          <span>
            {changedPaths.length} {changedPaths.length === 1 ? 'file' : 'files'} changed
          </span>
          <span>
            Ln {cursor.line}, Col {cursor.column}
          </span>
        </div>
      </section>

      {isConfirmingReset && (
        <Modal
          title="Reset file?"
          confirmLabel="Reset"
          onConfirm={confirmReset}
          onCancel={() => setIsConfirmingReset(false)}
        >
          Your changes to {file.path.slice(file.path.lastIndexOf('/') + 1)} are discarded and the
          original comes back.
        </Modal>
      )}
    </div>
  )
}

function TicketSidebar({ task }: { task: Task }) {
  const criteriaId = useId()
  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-r border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Today's ticket
        </span>
        <Difficulty level={task.difficulty} />
      </div>
      <h3 className="mb-3 text-lg font-semibold text-text-primary">{task.title}</h3>
      <p className="mb-3 text-sm text-text-muted">{task.description}</p>
      <StatusBadge status={task.status} />
      <hr className="my-3 border-border" />
      <h4
        id={criteriaId}
        className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted"
      >
        Acceptance criteria
      </h4>
      <ul aria-labelledby={criteriaId}>
        {splitCriteria(task.acceptanceCriteria).map((line, index) => (
          // Criteria lines are static content without stable keys — index is safe here
          <CriteriaItem key={index} text={line} />
        ))}
      </ul>
    </aside>
  )
}
