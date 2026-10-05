import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'

export function Tooltip({ text, children }: { text: string; children: ReactElement<{ 'aria-describedby'?: string }> }) {
  const id = useId()
  const trigger = useRef<HTMLSpanElement>(null)
  const hint = useRef<HTMLSpanElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  function show() { window.clearTimeout(timer.current); setOpen(true) }
  function hide() { window.clearTimeout(timer.current); setOpen(false) }
  useLayoutEffect(() => {
    if (!open) return
    const rect = trigger.current!.getBoundingClientRect()
    const box = hint.current!.getBoundingClientRect()
    setPosition({ left: Math.max(8, Math.min(rect.left, innerWidth - box.width - 8)), top: rect.bottom + box.height + 6 <= innerHeight ? rect.bottom + 6 : Math.max(8, rect.top - box.height - 6) })
  }, [open, text])
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => { window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true) }
  }, [open])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return <span ref={trigger} className="ui-tooltip-trigger" onMouseEnter={show} onMouseLeave={() => {
    timer.current = window.setTimeout(() => { if (!trigger.current?.contains(document.activeElement)) setOpen(false) }, 150)
  }} onFocus={show} onBlur={hide} onKeyDownCapture={event => { if (event.key === 'Escape' && open) { event.stopPropagation(); hide() } }}>
    {cloneElement(children, { 'aria-describedby': [children.props['aria-describedby'], id].filter(Boolean).join(' ') })}
    <span ref={hint} id={id} role="tooltip" className="ui-tooltip" hidden={!open} style={position}>{text}</span>
  </span>
}
