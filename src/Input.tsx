import { Icon } from './Icon'
import { useLayoutEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import './input.css'
export { Select } from './Select'

function classes(base: string, className?: string) {
  return className ? `${base} ${className}` : base
}

/** Native semantics and props, with the application's shared field treatment. */
export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  if (type === 'file') return <FileInput {...props} className={className} />
  if (type === 'search') return <SearchInput {...props} className={className} />
  const choice = type === 'checkbox' || type === 'radio'
  return <input {...props} type={type} className={classes(choice ? 'ui-choice' : 'ui-input', className)} />
}

function FileInput({ className, onChange, ...props }: ComponentProps<'input'>) {
  const field = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('No file selected')
  return <span className="ui-file-control"><input {...props} ref={field} type="file" hidden aria-hidden="true" tabIndex={-1} onChange={event => { setName(event.target.files?.[0]?.name ?? 'No file selected'); onChange?.(event) }} /><button type="button" className={classes('reset-button', className)} disabled={props.disabled} onClick={() => field.current?.click()}>Choose file</button><span className="ui-file-name">{name}</span></span>
}

function SearchInput({ className, ...props }: ComponentProps<'input'>) {
  const field = useRef<HTMLInputElement>(null)
  const [label, setLabel] = useState('')
  useLayoutEffect(() => {
    const source = field.current?.labels?.[0]
    if (source) { const copy = source.cloneNode(true) as HTMLElement; copy.querySelector('.ui-search-control')?.remove(); setLabel(copy.textContent?.trim() ?? '') }
  }, [])
  return <span className="ui-search-control"><input {...props} ref={field} type="search" aria-label={props['aria-label'] ?? (label || undefined)} className={classes('ui-input', className)} />{String(props.value ?? '').length > 0 && <button type="button" className="ui-search-clear" aria-label={`Clear ${label || 'search'}`} disabled={props.disabled} onClick={() => {
    const node = field.current!
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(node, '')
    node.dispatchEvent(new Event('input', { bubbles: true }))
    node.focus()
  }}><Icon name="close" /></button>}</span>
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
  const field = useRef<HTMLInputElement>(null)
  const [label, setLabel] = useState('value')
  useLayoutEffect(() => {
    const source = field.current?.labels?.[0]
    if (source) { const copy = source.cloneNode(true) as HTMLElement; copy.querySelector('.ui-number-control')?.remove(); setLabel(copy.textContent?.trim() || 'value') }
  }, [])
  const [edit, setEdit] = useState({ source: value, text: String(value) })
  const draft = edit.source === value ? edit.text : String(value)
  const parsed = Number(draft)
  const valid = draft.trim() !== '' && Number.isInteger(parsed) && parsed >= min && parsed <= max
  function step(amount: number) {
    const next = Math.max(min, Math.min(max, (valid ? parsed : value) + amount))
    setEdit({ source: next, text: String(next) })
    onValueChange(next)
  }
  return <span className="ui-number-control"><Input {...props} ref={field} aria-label={props['aria-label'] ?? label} type="number" inputMode="numeric" step={1} min={min} max={max} value={draft}
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
    }} /><span className="ui-number-buttons"><button type="button" disabled={props.disabled || value <= min} aria-label={`Decrease ${label}`} onClick={() => step(-1)}><Icon name="minus" /></button><button type="button" disabled={props.disabled || value >= max} aria-label={`Increase ${label}`} onClick={() => step(1)}><Icon name="plus" /></button></span></span>
}
