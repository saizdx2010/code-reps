import { useState } from 'react'
import type { ComponentProps } from 'react'
import './input.css'

function classes(base: string, className?: string) {
  return className ? `${base} ${className}` : base
}

/** Native semantics and props, with the application's shared field treatment. */
export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  const choice = type === 'checkbox' || type === 'radio'
  return <input {...props} type={type} className={classes(choice ? 'ui-choice' : type === 'file' ? 'ui-file-input' : 'ui-input', className)} />
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return <select {...props} className={classes('ui-select', className)}>{children}</select>
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea {...props} className={classes('ui-textarea', className)} />
}


type NumberInputProps = Omit<ComponentProps<'input'>, 'value' | 'defaultValue' | 'type' | 'onChange' | 'min' | 'max'> & {
  value: number
  min: number
  max: number
  onValueChange: (value: number) => void
}

/** Allow a field to be cleared while editing; commit only valid whole-number values. */
export function NumberInput({ value, min, max, onValueChange, onBlur, ...props }: NumberInputProps) {
  const [edit, setEdit] = useState({ source: value, text: String(value) })
  const draft = edit.source === value ? edit.text : String(value)
  const parsed = Number(draft)
  const valid = draft.trim() !== '' && Number.isInteger(parsed) && parsed >= min && parsed <= max
  return <Input {...props} type="number" inputMode="numeric" step={1} min={min} max={max} value={draft}
    aria-invalid={draft.trim() !== '' && !valid || undefined}
    onChange={event => {
      const next = event.target.value
      setEdit({ source: value, text: next })
      const number = Number(next)
      if (next.trim() && Number.isInteger(number) && number >= min && number <= max) onValueChange(number)
    }}
    onBlur={event => {
      setEdit({ source: value, text: String(value) })
      onBlur?.(event)
    }} />
}
