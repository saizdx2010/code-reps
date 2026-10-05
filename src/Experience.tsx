import { Input } from './Input'
import { getActiveProfile } from './local-store'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Rep } from './rep'
import type { TestResult } from './runner.types'

type ScreenState = { windowY: number; scroll: [number, number][]; open: Record<string, boolean>; focusId?: string }
const screens = new Map<string, ScreenState>()
export function ScreenMemory({ screenKey, children }: { screenKey: string; children: ReactNode }) {
  const memoryKey = `${getActiveProfile()}:${screenKey}`
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = root.current!
    const detailKey = (detail: HTMLDetailsElement) => `${detail.closest('[data-attempt-id]')?.getAttribute('data-attempt-id') ?? ''}:${detail.closest('section[id]')?.id ?? ''}:${detail.querySelector(':scope > summary')?.textContent ?? ''}`
    const scrollElements = () => Array.from(element.querySelectorAll<HTMLElement>('main, .catalog-list, .path-stages, .history-list, .task-column, .code-column'))
    let saved = screens.get(memoryKey)
    if (!saved) { try { saved = JSON.parse(sessionStorage.getItem(`code-reps:screen:${memoryKey}`) || 'null') } catch { /* Storage is optional. */ } }
    if (saved) {
      element.querySelectorAll('details').forEach(detail => { const open = saved!.open[detailKey(detail)]; if (typeof open === 'boolean') detail.open = open })
      scrollElements().forEach((item, index) => { const position = saved!.scroll[index]; if (position) { item.scrollTop = position[0]; item.scrollLeft = position[1] } })
      window.scrollTo(0, saved.windowY)
      if (saved.focusId) element.querySelector<HTMLElement>(`[id="${CSS.escape(saved.focusId)}"]`)?.focus({ preventScroll: true })
    } else { window.scrollTo(0, 0); element.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }) }
    const capture = () => {
      const state: ScreenState = { windowY: window.scrollY, scroll: scrollElements().map(item => [item.scrollTop, item.scrollLeft]), open: Object.fromEntries(Array.from(element.querySelectorAll('details')).map(item => [detailKey(item), item.open])), focusId: element.contains(document.activeElement) ? document.activeElement?.id : undefined }
      screens.set(memoryKey, state)
      try { sessionStorage.setItem(`code-reps:screen:${memoryKey}`, JSON.stringify(state)) } catch { /* Continue without session persistence. */ }
    }
    window.addEventListener('pagehide', capture)
    return () => { capture(); window.removeEventListener('pagehide', capture) }
  }, [memoryKey])
  return <div ref={root} className="screen-content">{children}</div>
}

export function SearchDrawer({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const node = dialog.current!; node.showModal(); return () => node.close() }, [])
  return <dialog ref={dialog} className={`utility-dialog ${className}`} aria-label={title} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose() } }} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose() } }}><div className="utility-heading"><h2>{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title}`}>Close <kbd>Esc</kbd></button></div>{children}</dialog>
}

export function GlossaryDrawer({ terms, onClose }: { terms: { term: string; meaning: string }[]; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const visible = terms.filter(item => `${item.term} ${item.meaning}`.toLowerCase().includes(query.toLowerCase()))
  return <SearchDrawer title="Quick glossary" className="glossary-drawer" onClose={onClose}><label className="field-label" htmlFor="glossary-query">Find a term</label><Input id="glossary-query" type="search" autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Try index, map, or frequency" /><p className="utility-note">Definitions stay available while you practise.</p><dl className="glossary-list">{visible.map(item => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl>{!visible.length && <p>No matching terms. Try a shorter search.</p>}</SearchDrawer>
}

type Command = { label: string; shortcut?: string; run: () => void }
export function CommandPalette({ reps, commands, onOpenRep, onClose }: { reps: Rep[]; commands: Command[]; onOpenRep: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const matches: Command[] = [...commands, ...reps.map(rep => ({ label: `Practice: ${rep.title}`, run: () => onOpenRep(rep.id) }))].filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
  const execute = (command: Command) => { onClose(); requestAnimationFrame(command.run) }
  useEffect(() => { document.getElementById(`command-${active}`)?.scrollIntoView({ block: 'nearest' }) }, [active])
  return <SearchDrawer title="Commands & exercises" onClose={onClose}><label htmlFor="command-query" className="field-label">Search or choose an action</label><Input id="command-query" autoFocus value={query} onChange={event => { setQuery(event.target.value); setActive(0) }} role="combobox" aria-expanded="true" aria-controls="command-results" aria-autocomplete="list" aria-activedescendant={matches.length ? `command-${active}` : undefined} placeholder="Find a page, rep, or workspace action…" onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setActive(index => Math.max(0, Math.min(matches.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))) } if (event.key === 'Enter' && matches[active]) { event.preventDefault(); execute(matches[active]) } }} /><p className="utility-note"><kbd>↑</kbd> <kbd>↓</kbd> choose · <kbd>Enter</kbd> open · <kbd>Ctrl / ⌘ K</kbd> commands · <kbd>Ctrl / ⌘ Enter</kbd> run checks</p><div id="command-results" role="listbox" aria-label="Matching commands" className="command-results">{matches.map((command, index) => <div key={command.label} id={`command-${index}`} role="option" aria-selected={index === active} onMouseEnter={() => setActive(index)}><button type="button" tabIndex={-1} onClick={() => execute(command)}>{command.label}{command.shortcut && <kbd>{command.shortcut}</kbd>}</button></div>)}</div>{!matches.length && <p>No matching commands or exercises.</p>}</SearchDrawer>
}

function formatValue(value: string) {
  try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value }
}

function ValueDifference({ value, other }: { value: string; other: string }) {
  const lines = formatValue(value).split('\n')
  const comparison = formatValue(other).split('\n')
  return <pre>{lines.map((line, index) => <span key={index} className={line === comparison[index] ? '' : 'diff-line'}>{line}{index < lines.length - 1 ? '\n' : ''}</span>)}</pre>
}

export function CheckFeedback({ results }: { results: TestResult[] }) {
  const failed = results.filter(result => !result.passed)
  const passed = results.filter(result => result.passed)
  const [activeFailed, setActiveFailed] = useState<string | null>(() => failed[0]?.name ?? null)
  const row = (result: TestResult) => <li key={result.name}><span className={result.passed ? 'pass-icon' : 'fail-icon'} aria-label={result.passed ? 'Passed' : 'Failed'}>{result.passed ? '✓' : '×'}</span><div>{result.passed ? <strong>{result.name}</strong> : <details open={activeFailed === result.name} onToggle={event => {
    const open = event.currentTarget.open
    setActiveFailed(current => open ? result.name : current === result.name ? null : current)
  }}><summary>{result.name}</summary>{result.input && <div><span className="field-label">Input</span><pre>{result.input}</pre></div>}{result.expected !== undefined && <div className="value-comparison"><div><span className="field-label">Expected</span><ValueDifference value={result.expected} other={result.actual ?? 'No returned value'} /></div><div><span className="field-label">Actual</span><ValueDifference value={result.actual ?? 'No returned value'} other={result.expected} /></div></div>}{result.message && !(result.expected !== undefined && result.message.startsWith('Expected ')) && <p>{result.message}</p>}<p className="utility-note">Trace this input through your code, then try again.</p></details>}</div></li>
  return <>{!!failed.length && <ul className="result-list">{failed.map(row)}</ul>}{!!passed.length && <details className="passed-checks"><summary>{passed.length} passed {passed.length === 1 ? 'check' : 'checks'}</summary><ul className="result-list">{passed.map(row)}</ul></details>}</>
}

export function WorkspaceSplit({ value, onChange, onCommit }: { value: number; onChange: (value: number) => void; onCommit: (value: number) => void }) {
  const stop = useRef<(() => void) | null>(null)
  useEffect(() => () => stop.current?.(), [])
  return <div className="workspace-split" role="separator" aria-label="Resize brief and editor" aria-orientation="vertical" aria-valuemin={25} aria-valuemax={60} aria-valuenow={value} tabIndex={0} onDoubleClick={() => { onChange(35); onCommit(35) }} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') { event.preventDefault(); const next = event.key === 'Home' ? 25 : event.key === 'End' ? 60 : Math.max(25, Math.min(60, value + (event.key === 'ArrowLeft' ? -2 : 2))); onChange(next); onCommit(next) } }} onPointerDown={event => {
    if (event.button !== 0) return
    event.preventDefault()
    const parent = event.currentTarget.parentElement!
    let width = value
    const move = (next: PointerEvent) => { const box = parent.getBoundingClientRect(); width = Math.max(25, Math.min(60, Math.round((next.clientX - box.left) / box.width * 100))); onChange(width) }
    const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); document.body.classList.remove('resizing-workspace'); stop.current = null; onCommit(width) }
    stop.current?.(); stop.current = end
    document.body.classList.add('resizing-workspace')
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end)
  }}><span /></div>
}
