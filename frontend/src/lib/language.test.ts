import { describe, expect, it } from 'vitest'
import { languageForPath } from './language'

describe('languageForPath', () => {
  it.each([
    ['src/main/java/App.java', 'java'],
    ['pom.xml', 'xml'],
    ['application.properties', 'ini'],
    ['README.md', 'markdown'],
    ['data/seed.JSON', 'json'],
    ['db/V1__init.sql', 'sql'],
  ])('maps %s to %s', (path, language) => {
    expect(languageForPath(path)).toBe(language)
  })

  it.each(['Dockerfile', '.gitignore', 'notes.txt', 'some.dir/Makefile'])(
    'falls back to plaintext for %s',
    (path) => {
      expect(languageForPath(path)).toBe('plaintext')
    },
  )
})
