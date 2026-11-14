import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDrafts, type DraftFile } from '../hooks/useDrafts'
import { useSubmission } from '../hooks/useSubmission'
import { useToast } from '../hooks/useToast'
import { languageForPath } from '../lib/language'
import { Button } from '../components/Button'
import { buttonClasses } from '../components/buttonClasses'
import { DiffView } from '../components/DiffView'
import { Icon } from '../components/Icon'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { PanelMessage, TaskFilesGate } from '../components/TaskFilesGate'
import { TextLink } from '../components/TextLink'
import type { Submission } from '../types/submission'
import { EDITABLE_STATUSES, type Task } from '../types/task'

const MAX_COMMIT_MESSAGE_LENGTH = 72

/** A file in the change list: the codebase original against the version shown. */
interface Change {
  path: string
  original: string
  modified: string
}

/** Game flavour only: there is no real Git. `List the users!` on task 12 → feat/task-12-list-the-users */
function branchName(task: Task): string {
  const slug = task.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `feat/task-${task.id}-${slug}`
}

const fileName = (path: string) => path.slice(path.lastIndexOf('/') + 1)

/** Panel tab where the player reviews their changes, commits and pushes them (Screens 6a, 6b). */
export default function VcsPage() {
  return <TaskFilesGate action="change">{(task) => <SourceControl task={task} />}</TaskFilesGate>
}

function SourceControl({ task }: { task: Task }) {
  const drafts = useDrafts()
  const { latest, isLoading, loadError, pushError, push } = useSubmission()
  const { showToast } = useToast()
  const [message, setMessage] = useState('')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [split, setSplit] = useState(false)
  const [lineCounts, setLineCounts] = useState({ added: 0, removed: 0 })
  const [isConfirming, setIsConfirming] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  // useTask only refetches when the tab is shown again, so a push here is known before the status.
  const [pushedFromStatus, setPushedFromStatus] = useState<Task['status'] | null>(null)
  const lastPushHeading = useRef<HTMLHeadingElement>(null)
  const { loadDrafts } = drafts

  useEffect(() => loadDrafts(task), [task, loadDrafts])

  const isPushed = !EDITABLE_STATUSES.includes(task.status) || pushedFromStatus === task.status

  if (isLoading || drafts.isLoading) return <PanelMessage>Loading your changes…</PanelMessage>
  if (loadError || drafts.error)
    return <p className="p-6 text-danger">{loadError ?? drafts.error}</p>

  const changes = isPushed ? pushedChanges(drafts.files, latest) : draftChanges(drafts.files)
  if (changes.length === 0) {
    return (
      <PanelMessage>
        No changes yet. Edit the task's files, then come back to push them.
        <TextLink to="/room/editor">Open the editor</TextLink>
      </PanelMessage>
    )
  }

  const selected = changes.find((change) => change.path === selectedPath) ?? changes[0]
  const attempt = isPushed ? latest?.attemptNumber : (latest?.attemptNumber ?? 0) + 1
  const trimmedMessage = message.trim()

  const confirmPush = async () => {
    setIsConfirming(false)
    setIsPushing(true)
    const files = changes.map(({ path, modified }) => ({ path, content: modified }))
    const ok = await push(trimmedMessage, files)
    setIsPushing(false)
    if (!ok) return
    setPushedFromStatus(task.status)
    // Phase 4 has no reviewer: the toast must not claim a review is running.
    showToast({
      tone: 'success',
      title: 'Pushed · waiting for review',
      message: `Attempt ${attempt} is in. Head back to the room if you like.`,
    })
    // The push button becomes disabled, so focus would fall to <body>.
    requestAnimationFrame(() => lastPushHeading.current?.focus())
  }

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border p-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Source control
          </p>
          <span className="inline-flex items-center gap-2 rounded-md bg-bg-elevated px-2 py-1 font-mono text-xs text-text-primary">
            <Icon name="branch" />
            {branchName(task)}
          </span>
        </div>

        <h3
          ref={lastPushHeading}
          tabIndex={-1}
          className="text-xs font-semibold uppercase tracking-wide text-text-muted"
        >
          {isPushed && latest ? `Last push · ${latest.commitHash}` : `Changes · ${changes.length}`}
        </h3>
        <ul aria-label="Changed files" className="-mt-2 flex flex-col">
          {changes.map((change) => (
            <li key={change.path}>
              <button
                type="button"
                title={change.path}
                aria-current={change === selected}
                onClick={() => setSelectedPath(change.path)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 font-mono text-xs ${
                  change === selected
                    ? 'bg-accent-subtle text-accent-on-subtle'
                    : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary'
                }`}
              >
                <span className="truncate">{fileName(change.path)}</span>
                <span className="rounded-sm bg-warning-subtle px-1.5 text-warning">M</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-3">
          <Input
            label="Commit message"
            value={isPushed ? (latest?.commitMessage ?? '') : message}
            onChange={setMessage}
            maxLength={MAX_COMMIT_MESSAGE_LENGTH}
            disabled={isPushed}
            helper={
              isPushed
                ? `Committed as ${latest?.commitHash}`
                : `Conventional commit · ${message.length} / ${MAX_COMMIT_MESSAGE_LENGTH}`
            }
          />
          {isPushed ? (
            <Button disabled>Pushed · waiting for review</Button>
          ) : (
            <Button
              disabled={trimmedMessage === '' || isPushing}
              onClick={() => setIsConfirming(true)}
            >
              {isPushing ? 'Pushing…' : 'Commit & push for review'}
            </Button>
          )}
          {pushError && !isPushed && (
            <p role="alert" className="text-sm text-danger">
              {pushError}
            </p>
          )}
          <p className="text-label-s text-text-muted">
            {isPushed && latest
              ? `Attempt ${latest.attemptNumber} submitted at ${new Date(latest.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Head back to the room if you like.`
              : `${changes.length} ${changes.length === 1 ? 'file' : 'files'} · attempt ${attempt}. Pushing sends your commit for review.`}
          </p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-2">
          <p className="min-w-0 truncate font-mono text-xs text-text-primary">{selected.path}</p>
          <span className="font-mono text-xs text-success">+{lineCounts.added}</span>
          <span className="font-mono text-xs text-danger">−{lineCounts.removed}</span>
          <span className="flex-1" />
          {isPushed && latest && (
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-success-subtle px-2 py-0.5 text-xs text-success">
              <Icon name="check" />
              Pushed · {latest.commitHash}
            </span>
          )}
          <div
            role="group"
            aria-label="Diff layout"
            className="flex rounded-md border border-border p-0.5"
          >
            {[false, true].map((option) => (
              <button
                key={String(option)}
                type="button"
                aria-pressed={split === option}
                onClick={() => setSplit(option)}
                className={`rounded-sm px-2 py-0.5 text-xs ${
                  split === option ? 'bg-bg-elevated text-text-primary' : 'text-text-muted'
                }`}
              >
                {option ? 'Split' : 'Unified'}
              </button>
            ))}
          </div>
          <Link
            to={{
              pathname: '/room/editor',
              search: `?${new URLSearchParams({ file: selected.path })}`,
            }}
            className={`${buttonClasses('secondary')} shrink-0 whitespace-nowrap`}
          >
            Open in editor
          </Link>
        </div>
        <div className="min-h-0 flex-1">
          <DiffView
            original={selected.original}
            modified={selected.modified}
            language={languageForPath(selected.path)}
            path={selected.path}
            split={split}
            onLineCounts={(added, removed) => setLineCounts({ added, removed })}
            ariaLabel={`Changes to ${fileName(selected.path)}`}
          />
        </div>
      </section>

      {isConfirming && (
        <Modal
          title="Push to review?"
          confirmLabel="Push"
          confirmVariant="primary"
          onConfirm={() => void confirmPush()}
          onCancel={() => setIsConfirming(false)}
        >
          {changes.length} {changes.length === 1 ? 'file' : 'files'} as attempt {attempt}. Once
          pushed, the files are read-only until the review.
        </Modal>
      )}
    </div>
  )
}

function draftChanges(files: DraftFile[]): Change[] {
  return files
    .filter((file) => file.draft !== file.original)
    .map((file) => ({ path: file.path, original: file.original, modified: file.draft }))
}

/** After a push the panel shows what was pushed, which may differ from later drafts. */
function pushedChanges(files: DraftFile[], latest: Submission | null): Change[] {
  return (latest?.files ?? []).map((pushed) => ({
    path: pushed.path,
    original: files.find((file) => file.path === pushed.path)?.original ?? '',
    modified: pushed.content,
  }))
}
