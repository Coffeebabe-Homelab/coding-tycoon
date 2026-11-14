import type { ButtonHTMLAttributes, Ref } from 'react'
import { buttonClasses, type ButtonVariant } from './buttonClasses'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant
  ref?: Ref<HTMLButtonElement>
}

/** Figma Button (8:31). Defaults to type="button" so it can't submit a form by accident. */
export function Button({ variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant)} {...props} />
}
