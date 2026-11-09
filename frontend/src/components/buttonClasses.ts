export type ButtonVariant = 'primary' | 'secondary' | 'danger'

const BASE_CLASSES =
  'inline-block rounded-md px-4 py-2 text-label-m transition-colors disabled:cursor-not-allowed disabled:opacity-40'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink not-disabled:hover:bg-accent-hover',
  secondary:
    'border border-border bg-bg-elevated text-text-primary not-disabled:hover:border-border-strong',
  danger:
    'border border-danger bg-danger-subtle text-danger not-disabled:hover:bg-danger not-disabled:hover:text-accent-ink',
}

/** Classes for a Button look-alike. For a router Link, which must stay an anchor. */
export function buttonClasses(variant: ButtonVariant): string {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]}`
}
