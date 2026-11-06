import { describe, expect, it } from 'vitest'
import { ancestorFolders, buildFileTree, type FileTreeNode } from './fileTree'

const names = (nodes: FileTreeNode[]) => nodes.map((node) => node.name)

describe('buildFileTree', () => {
  it('returns nothing for no paths', () => {
    expect(buildFileTree([])).toEqual([])
  })

  it('nests files under folders and records full paths', () => {
    const [src] = buildFileTree(['src/main/App.java'])

    expect(src).toMatchObject({ name: 'src', path: 'src', type: 'folder' })
    expect(src.children[0]).toMatchObject({ name: 'main', path: 'src/main', type: 'folder' })
    expect(src.children[0].children[0]).toEqual({
      name: 'App.java',
      path: 'src/main/App.java',
      type: 'file',
      children: [],
    })
  })

  it('merges paths that share a folder', () => {
    const tree = buildFileTree(['src/B.java', 'src/A.java'])

    expect(tree).toHaveLength(1)
    expect(names(tree[0].children)).toEqual(['A.java', 'B.java'])
  })

  it('sorts folders before files at every level, then by name', () => {
    const tree = buildFileTree(['z.md', 'b/x.md', 'a.md', 'a/z.md', 'a/k/y.md'])

    expect(names(tree)).toEqual(['a', 'b', 'a.md', 'z.md'])
    expect(names(tree[0].children)).toEqual(['k', 'z.md'])
  })

  it('ignores stray slashes', () => {
    expect(buildFileTree(['/src//App.java'])[0].children[0].path).toBe('src/App.java')
  })
})

describe('ancestorFolders', () => {
  it('lists every containing folder, outermost first', () => {
    expect(ancestorFolders('src/a/B.java')).toEqual(['src', 'src/a'])
  })

  it('returns nothing for a top-level file or an empty path', () => {
    expect(ancestorFolders('README.md')).toEqual([])
    expect(ancestorFolders('')).toEqual([])
  })
})
