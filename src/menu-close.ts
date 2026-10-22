import type { KeyboardEvent, MouseEvent } from 'react'

// Header menus (Tools, the rep switcher) close once an action is chosen, and Escape returns focus to its summary.
export function closeOnAction(event: MouseEvent<HTMLDetailsElement>) {
  if ((event.target as HTMLElement).closest('button')) event.currentTarget.open = false
}
export function closeOnEscape(event: KeyboardEvent<HTMLDetailsElement>) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  event.currentTarget.open = false
  event.currentTarget.querySelector('summary')?.focus()
}
