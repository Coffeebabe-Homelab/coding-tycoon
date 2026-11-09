const LEVEL_CLASSES = new Map([
  ['easy', 'bg-success-subtle text-success'],
  ['medium', 'bg-warning-subtle text-warning'],
  ['hard', 'bg-danger-subtle text-danger'],
])
const UNKNOWN_LEVEL_CLASSES = 'bg-bg-elevated text-text-muted'

/** Figma Difficulty (8:106). The API sends a plain string, so any other value renders neutral. */
export function Difficulty({ level }: { level: string }) {
  const colours = LEVEL_CLASSES.get(level.toLowerCase()) ?? UNKNOWN_LEVEL_CLASSES
  return <span className={`rounded-sm px-2 py-1 text-label-s ${colours}`}>{level}</span>
}
