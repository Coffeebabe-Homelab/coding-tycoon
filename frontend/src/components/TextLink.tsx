import { Link, type LinkProps } from 'react-router-dom'

/** Inline accent-coloured router link with a hover state. */
export function TextLink({ className = '', ...props }: LinkProps) {
  return (
    <Link
      className={`text-sm text-accent transition-colors hover:text-accent-hover ${className}`}
      {...props}
    />
  )
}
