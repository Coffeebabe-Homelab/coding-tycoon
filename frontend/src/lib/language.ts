// Monaco has no dedicated .properties grammar; its 'ini' grammar covers the same key=value syntax.
const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  java: 'java',
  xml: 'xml',
  properties: 'ini',
  md: 'markdown',
  json: 'json',
  sql: 'sql',
}

/**
 * Picks the Monaco language id for a file path from its extension.
 *
 * @param path file path or name, e.g. `src/main/java/App.java`
 * @returns a Monaco language id, `plaintext` when the extension is unknown
 */
export function languageForPath(path: string): string {
  const fileName = path.slice(path.lastIndexOf('/') + 1)
  const dot = fileName.lastIndexOf('.')
  if (dot <= 0) return 'plaintext'
  return LANGUAGE_BY_EXTENSION[fileName.slice(dot + 1).toLowerCase()] ?? 'plaintext'
}
