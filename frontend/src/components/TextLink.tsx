import { Link, type LinkProps } from 'react-router-dom'

/** Inline accent-coloured router link with paired hover and focus states. */
export function TextLink({ className = '', ...props }: LinkProps) {
  return (
    <Link
      className={`text-sm text-accent transition-colors hover:text-accent-hover focus:text-accent-hover focus:outline-none focus:underline ${className}`}
      {...props}
    />
  )
}
