import type { ComponentProps } from 'react'

type Props = ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'text' | 'danger' }
const variants = { primary: 'primary-button', secondary: 'reset-button', text: 'text-button', danger: 'danger-button' }

/** Reuse the existing action styles, with an explicit hierarchy for product tools. */
export function Button({ variant = 'secondary', type = 'button', className, ...props }: Props) {
  return <button {...props} type={type} className={`ui-button ${variants[variant]}${className ? ` ${className}` : ''}`} />
}

/** An on/off setting: a pressed button named by its setting, with On or Off beside the name (like Appearance's Dark mode). */
export function Toggle({ on, className, children, ...props }: ComponentProps<'button'> & { on: boolean }) {
  return (
    <button {...props} type="button" aria-pressed={on} className={`toggle-button${className ? ` ${className}` : ''}`}>
      {children}
      <span key={String(on)} aria-hidden="true">
        {on ? 'On' : 'Off'}
      </span>
    </button>
  )
}
