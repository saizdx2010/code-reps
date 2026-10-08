import { Icon } from './Icon'
import { useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return dateKey(date) === value ? date : undefined
}
function addMonth(date: Date, amount: number) {
  const end = new Date(date.getFullYear(), date.getMonth() + amount + 1, 0)
  return new Date(end.getFullYear(), end.getMonth(), Math.min(date.getDate(), end.getDate()))
}

/** A local calendar; selected dates retain the existing YYYY-MM-DD filter contract. */
export function DateInput({ value, onValueChange, label = 'Date' }: { value: string; onValueChange: (value: string) => void; label?: string }) {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const [focused, setFocused] = useState(() => parseDate(value) ?? new Date())
  const [month, setMonth] = useState(() => new Date(focused.getFullYear(), focused.getMonth(), 1))
  const today = dateKey(new Date())
  const selected = parseDate(value)
  const monthName = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay())
  useLayoutEffect(() => {
    if (dialog.current?.open) dialog.current.querySelector<HTMLButtonElement>(`[data-date="${dateKey(focused)}"]`)?.focus()
  }, [focused])
  function focusDate(date: Date) {
    setFocused(date)
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
  }
  function close() { dialog.current?.close(); trigger.current?.focus({ preventScroll: true }) }
  function choose(date: string) { onValueChange(date); close() }
  function show() {
    const date = parseDate(value) ?? new Date()
    setFocused(date)
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    dialog.current?.showModal()
  }
  return <span className="ui-date-control">
    <button ref={trigger} type="button" className="ui-input ui-date-trigger" aria-label={label} aria-describedby={`${id}-value`} aria-haspopup="dialog" aria-controls={`${id}-calendar`} data-value={value} onClick={show}><span id={`${id}-value`}>{selected ? selected.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Any date'}</span><Icon name="calendar" /></button>
    {createPortal(<dialog ref={dialog} id={`${id}-calendar`} className="ui-calendar" aria-labelledby={`${id}-title`} onCancel={event => { event.preventDefault(); close() }} onClick={event => {
      if (event.target !== event.currentTarget) return
      const box = event.currentTarget.getBoundingClientRect()
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close()
    }}>
      <div className="ui-calendar-heading"><button type="button" className="ui-calendar-icon" aria-label="Previous month" onClick={() => focusDate(addMonth(focused, -1))}><Icon name="left" /></button><h2 id={`${id}-title`} aria-live="polite">{monthName}</h2><button type="button" className="ui-calendar-icon" aria-label="Next month" onClick={() => focusDate(addMonth(focused, 1))}><Icon name="right" /></button></div>
      <p className="ui-calendar-help" id={`${id}-help`}>Arrow keys move by day or week. Page Up and Page Down change month.</p>
      <table role="grid" aria-label={monthName} aria-describedby={`${id}-help`} className="ui-calendar-grid"><thead><tr>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => <th key={day} scope="col" aria-label={day}>{day.slice(0, 2)}</th>)}</tr></thead><tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>{Array.from({ length: 7 }, (_, day) => {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + day)
        const key = dateKey(date)
        return <td key={key} role="gridcell" aria-selected={value === key}><button type="button" data-date={key} aria-label={date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} aria-current={today === key ? 'date' : undefined} tabIndex={dateKey(focused) === key ? 0 : -1} className={`ui-calendar-day${date.getMonth() !== month.getMonth() ? ' other-month' : ''}${value === key ? ' selected' : ''}`} onClick={() => choose(key)} onKeyDown={event => {
          let next: Date | undefined
          const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -date.getDay(), End: 6 - date.getDay() }
          if (event.key in offsets) next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsets[event.key])
          if (event.key === 'PageUp' || event.key === 'PageDown') next = addMonth(date, (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1))
          if (next) { event.preventDefault(); focusDate(next) }
        }}>{date.getDate()}</button></td>
      })}</tr>)}</tbody></table>
      <div className="ui-calendar-actions"><button type="button" className="text-button" onClick={() => choose('')}>Clear date</button><button type="button" className="reset-button" onClick={() => choose(today)}>Today</button><button type="button" className="reset-button" onClick={close}>Cancel</button></div>
    </dialog>, document.body)}
  </span>
}
