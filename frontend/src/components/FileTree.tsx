import { useState } from 'react'
import { ancestorFolders, type FileTreeNode } from '../lib/fileTree'

const ROW_CLASSES =
  'flex w-full items-center gap-2 rounded px-2 py-1 text-left font-mono text-sm hover:bg-bg-elevated focus:bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-accent'

const GLYPH_BY_EXTENSION: Record<string, string> = {
  java: 'J',
  xml: '<>',
  properties: '≡',
  md: 'M',
  json: '{}',
  sql: 'DB',
}

/** Short text glyph per file type, so no icon library is needed. */
function fileGlyph(name: string): string {
  const extension = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  return GLYPH_BY_EXTENSION[extension] ?? '·'
}

interface FileTreeProps {
  nodes: FileTreeNode[]
  selectedPath: string | null
  focusFiles: string[]
  onSelect: (path: string) => void
}

/**
 * Collapsible codebase tree built from native buttons, so Tab, Enter and Space work.
 * Folders leading to the selected and focus files start expanded.
 */
export function FileTree({ nodes, selectedPath, focusFiles, onSelect }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([...focusFiles, selectedPath ?? ''].flatMap(ancestorFolders)),
  )

  const toggle = (path: string) => {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const renderNodes = (level: FileTreeNode[]) => (
    <ul className="flex flex-col gap-0.5 pl-3 first:pl-0">
      {level.map((node) =>
        node.type === 'folder' ? (
          <li key={node.path}>
            <button
              type="button"
              aria-expanded={expanded.has(node.path)}
              onClick={() => toggle(node.path)}
              className={`${ROW_CLASSES} text-text-muted`}
            >
              <span aria-hidden="true">{expanded.has(node.path) ? '▾' : '▸'}</span>
              {node.name}
            </button>
            {expanded.has(node.path) && renderNodes(node.children)}
          </li>
        ) : (
          <li key={node.path}>
            <button
              type="button"
              aria-current={node.path === selectedPath ? 'true' : undefined}
              onClick={() => onSelect(node.path)}
              className={`${ROW_CLASSES} ${node.path === selectedPath ? 'bg-bg-elevated' : ''} ${
                focusFiles.includes(node.path) ? 'text-warning' : 'text-text-primary'
              }`}
            >
              <span
                aria-hidden="true"
                className="w-5 shrink-0 text-center text-xs text-accent-hover"
              >
                {fileGlyph(node.name)}
              </span>
              {node.name}
              {focusFiles.includes(node.path) && <span className="sr-only">(focus file)</span>}
            </button>
          </li>
        ),
      )}
    </ul>
  )

  return <nav aria-label="Codebase files">{renderNodes(nodes)}</nav>
}
