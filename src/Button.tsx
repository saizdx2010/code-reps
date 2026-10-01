import type { ComponentProps } from 'react'

type Props = ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'text' | 'danger' }
const variants = { primary: 'primary-button', secondary: 'reset-button', text: 'text-button', danger: 'danger-button' }

/** Reuse the existing action styles, with an explicit hierarchy for product tools. */
export function Button({ variant = 'secondary', type = 'button', className, ...props }: Props) {
  return <button {...props} type={type} className={`ui-button ${variants[variant]}${className ? ` ${className}` : ''}`} />
}
