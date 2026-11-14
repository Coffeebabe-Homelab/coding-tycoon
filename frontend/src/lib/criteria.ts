/** Splits a task's acceptance criteria text into one trimmed criterion per non-blank line. */
export function splitCriteria(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}
