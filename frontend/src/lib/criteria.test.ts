import { describe, expect, it } from 'vitest'
import { splitCriteria } from './criteria'

describe('splitCriteria', () => {
  it('gives one trimmed criterion per non-blank line', () => {
    expect(splitCriteria('Returns 200\n\n  Returns JSON  \n')).toEqual([
      'Returns 200',
      'Returns JSON',
    ])
  })
})
