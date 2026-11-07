/** A folder or file in the codebase tree. `path` is the full relative path. */
export interface FileTreeNode {
  name: string
  path: string
  type: 'folder' | 'file'
  children: FileTreeNode[]
}

/**
 * Turns a flat list of relative paths into a nested tree.
 * Each level is sorted with folders first, then by name.
 *
 * @param paths e.g. `['README.md', 'src/App.java']`
 * @returns the top-level nodes
 */
export function buildFileTree(paths: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = []
  for (const path of paths) {
    const parts = path.split('/').filter(Boolean)
    let level = root
    parts.forEach((name, index) => {
      const type = index === parts.length - 1 ? 'file' : 'folder'
      let node = level.find((candidate) => candidate.name === name && candidate.type === type)
      if (!node) {
        node = { name, path: parts.slice(0, index + 1).join('/'), type, children: [] }
        level.push(node)
      }
      level = node.children
    })
  }
  return sortTree(root)
}

function sortTree(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .map((node) => ({ ...node, children: sortTree(node.children) }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

/**
 * Lists the folder paths that contain a file, e.g. `src/a/B.java` → `['src', 'src/a']`.
 * Used to expand the tree down to the open and focus files.
 */
export function ancestorFolders(path: string): string[] {
  const parts = path.split('/').filter(Boolean)
  return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join('/'))
}
