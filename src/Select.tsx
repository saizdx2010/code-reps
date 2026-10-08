import { Icon } from './Icon'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'

type Option = { value: string; label: string; disabled: boolean }

/** App-owned select UI. The hidden native field retains the existing form/change contract. */
export function Select({ className, children, id, ...props }: ComponentProps<'select'>) {
  const generated = useId()
  const controlId = id ?? `select-${generated}`
  const field = useRef<HTMLSelectElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [label, setLabel] = useState('')
  const [uncontrolledValue, setUncontrolledValue] = useState(String(props.defaultValue ?? ''))
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 300, above: false })
  const search = useRef({ text: '', at: 0 })
  useLayoutEffect(() => {
    const node = field.current!
    if (props.value === undefined) setUncontrolledValue(node.value)
    setOptions(Array.from(node.options, option => ({ value: option.value, label: option.label, disabled: option.disabled })))
    const source = trigger.current?.labels?.[0] ?? trigger.current?.closest('label')
    if (source) {
      const copy = source.cloneNode(true) as HTMLElement
      copy.querySelector('.ui-select-control')?.remove()
      setLabel(copy.textContent?.trim() ?? '')
    }
  }, [children, props.value])
  const selected = options.findIndex(option => option.value === String(props.value ?? uncontrolledValue))
  function close() { setOpen(false) }
  function show(index = Math.max(0, selected)) {
    if (props.disabled) return
    setActive(index)
    setOpen(true)
  }
  function choose(index: number, restoreFocus = true) {
    const option = options[index]
    if (!option || option.disabled) return
    if (field.current!.value !== option.value) {
      field.current!.value = option.value
      if (props.value === undefined) setUncontrolledValue(option.value)
      field.current!.dispatchEvent(new Event('change', { bubbles: true }))
    }
    close()
    if (restoreFocus) trigger.current?.focus({ preventScroll: true })
  }
  useLayoutEffect(() => {
    const node = popup.current!
    if (!open) { if (node.hidePopover && node.matches(':popover-open')) node.hidePopover(); return }
    const rect = trigger.current!.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom - 12
    const above = rect.top - 12
    const useBelow = below >= 240 || below >= above
    const height = Math.min(300, useBelow ? below : above)
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)), top: useBelow ? rect.bottom + 6 : rect.top - 6, width: Math.min(rect.width, window.innerWidth - 16), maxHeight: height, above: !useBelow })
    node.showPopover?.()
  }, [open])
  useEffect(() => {
    if (!open) return
    const container = popup.current
    const option = container?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    if (!container || !option) return
    const top = option.offsetTop
    const bottom = top + option.offsetHeight
    if (top < container.scrollTop) container.scrollTop = top
    else if (bottom > container.scrollTop + container.clientHeight) container.scrollTop = bottom - container.clientHeight
  }, [active, open])
  useEffect(() => {
    if (!open) return
    const anchor = trigger.current!.getBoundingClientRect()
    const dismiss = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) close() }
    const reposition = (event: Event) => {
      if (popup.current?.contains(event.target as Node)) return
      const rect = trigger.current?.getBoundingClientRect()
      if (!rect || Math.abs(rect.top - anchor.top) > 1 || Math.abs(rect.left - anchor.left) > 1) close()
    }
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', reposition, true)
    return () => { document.removeEventListener('pointerdown', dismiss); window.removeEventListener('resize', close); window.removeEventListener('scroll', reposition, true) }
  }, [open])
  function move(direction: number) {
    let next = active
    do { next += direction } while (options[next]?.disabled)
    if (options[next]) setActive(next)
  }
  return <span className="ui-select-control">
    <button ref={trigger} id={controlId} type="button" role="combobox" data-value={options[selected]?.value ?? ''} aria-label={props['aria-label'] ?? label} aria-labelledby={props['aria-labelledby']} aria-describedby={props['aria-describedby']} aria-required={props.required} aria-invalid={props['aria-invalid']} aria-expanded={open} aria-haspopup="listbox" aria-controls={`${controlId}-list`} aria-activedescendant={open ? `${controlId}-option-${active}` : undefined} disabled={props.disabled} className={`ui-select${className ? ` ${className}` : ''}`} onClick={() => open ? close() : show()} onBlur={() => { if (open) choose(active, false) }} onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close() }
      else if (event.key === 'Tab') { if (open) choose(active, false) }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (open) choose(active); else show() }
      else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (open) move(event.key === 'ArrowDown' ? 1 : -1); else show() }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); const index = event.key === 'Home' ? options.findIndex(option => !option.disabled) : options.findLastIndex(option => !option.disabled); if (open) setActive(index); else show(index) }
      else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        const now = Date.now()
        search.current = { text: now - search.current.at < 700 ? search.current.text + event.key.toLowerCase() : event.key.toLowerCase(), at: now }
        const index = options.findIndex(option => !option.disabled && option.label.toLowerCase().startsWith(search.current.text))
        if (index >= 0) { setActive(index); if (!open) show(index) }
      }
    }}><span>{options[selected]?.label ?? options[0]?.label ?? ''}</span><Icon name="chevron" /></button>
    <select {...props} ref={field} id={`${controlId}-native`} hidden aria-hidden="true" aria-label={undefined} aria-labelledby={undefined} tabIndex={-1} className="ui-select-native">{children}</select>
    <div ref={popup} id={`${controlId}-list`} role="listbox" aria-label={`${props['aria-label'] ?? label} options`} popover="manual" hidden={!open} className="ui-select-popup" style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight, transform: position.above ? 'translateY(-100%)' : undefined }}>
      {options.map((option, index) => <div key={`${option.value}:${index}`} id={`${controlId}-option-${index}`} role="option" aria-selected={index === active} aria-disabled={option.disabled || undefined} data-index={index} data-value={option.value} className={index === active ? 'ui-option active' : 'ui-option'} onPointerMove={() => { if (!option.disabled) setActive(index) }} onPointerDown={event => event.preventDefault()} onClick={event => { event.preventDefault(); choose(index) }}><span>{option.label}</span>{index === selected && <Icon name="check" />}</div>)}
    </div>
  </span>
}
