import { Button } from './Button'
import { Icon } from './Icon'
import { Input } from './Input'
import { reducedMotion } from './ui-motion'
import { getActiveProfile } from './local-store'
import { setScreenNavigated } from './screen-focus'
import { useGlossary } from './useGlossary'
import { lazy, Suspense, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react'
import { searchPalette } from './command-search'
import type { SearchEntry, SearchTarget } from './command-search'
import type { ResultTable, TestResult } from './runner.types'

// SQLite row comparisons load with the first failed SQL check. If they cannot load, the check's sentence still shows.
const SqlPlan = lazy(() =>
  import('./SqlResults')
    .then(module => ({ default: module.SqlPlan }))
    .catch(() => ({ default: ({ lines }: { lines: string[] }) => <pre>{lines.join('\n')}</pre> })),
)
const SqlComparison = lazy(() =>
  import('./SqlResults')
    .then(module => ({ default: module.SqlComparison }))
    .catch(() => ({
      default: ({ table }: { table: ResultTable; stale: boolean }) => <p>{[table.columnNote, table.first].filter(Boolean).join(' ')}</p>,
    })),
)

type ScreenState = { windowY: number; scroll: [number, number][]; open: Record<string, boolean>; focusId?: string }
const screens = new Map<string, ScreenState>()
// The screen the page last showed. Undefined until the first screen mounts, so a fresh load never moves focus.
let shownScreen: string | undefined
// Whether the shown screen should hand focus to a late-arriving heading; Strict Mode's repeat run reuses the first run's answer.
let shownHandoff = false
export function ScreenMemory({ screenKey, children }: { screenKey: string; children: ReactNode }) {
  const memoryKey = `${getActiveProfile()}:${screenKey}`
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = root.current!
    // Strict Mode runs this effect twice for one screen; the second run sees the same key and does not count as navigation.
    const repeat = shownScreen === memoryKey
    const navigated = shownScreen !== undefined && !repeat
    shownScreen = memoryKey
    // Only ever set on navigation: the Strict Mode second run must not clear what the first run recorded.
    if (navigated) setScreenNavigated(true)
    const detailKey = (detail: HTMLDetailsElement) => {
      const attempt = detail.closest('[data-attempt-id]')?.getAttribute('data-attempt-id') ?? ''
      return `${attempt}:${detail.closest('section[id]')?.id ?? ''}:${detail.querySelector(':scope > summary')?.textContent ?? ''}`
    }
    const scrollElements = () =>
      Array.from(element.querySelectorAll<HTMLElement>('main, .catalog-list, .path-stages, .history-list, .task-column, .code-column'))
    let saved = screens.get(memoryKey)
    if (!saved) {
      try {
        saved = JSON.parse(sessionStorage.getItem(`code-reps:screen:${memoryKey}`) || 'null')
      } catch {
        /* Storage is optional. */
      }
    }
    if (saved) {
      element.querySelectorAll('details').forEach(detail => {
        const open = saved!.open[detailKey(detail)]
        if (typeof open === 'boolean') detail.open = open
      })
      scrollElements().forEach((item, index) => {
        const position = saved!.scroll[index]
        if (position) {
          item.scrollTop = position[0]
          item.scrollLeft = position[1]
        }
      })
      window.scrollTo(0, saved.windowY)
      const focusTarget = saved.focusId ? element.querySelector<HTMLElement>(`[id="${CSS.escape(saved.focusId)}"]`) : null
      if (focusTarget) focusTarget.focus({ preventScroll: true })
      else if (navigated) element.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
    } else {
      window.scrollTo(0, 0)
      // In-app navigation moves focus to the new page heading; a page load leaves focus at the top, so the skip link stays the first stop.
      if (navigated) element.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
    }
    // By the time this cleanup runs, the arriving screen may already have reset the window scroll and moved focus, so a
    // read at cleanup would save the new screen's position. Track both while this screen is shown and save those.
    let windowY = saved && window.scrollY === saved.windowY ? saved.windowY : window.scrollY
    let focusId = saved?.focusId
    const onScroll = () => {
      if (element.isConnected && shownScreen === memoryKey) windowY = window.scrollY
    }
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && element.contains(event.target)) focusId = event.target.id || undefined
    }
    // A lazy page may still be loading when its saved position is restored; scroll again once its content can hold it.
    const pendingY = saved && window.scrollY < saved.windowY ? saved.windowY : undefined
    const settleScroll =
      pendingY !== undefined && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (document.documentElement.scrollHeight - window.innerHeight < pendingY) return
            if (window.scrollY < pendingY && windowY < pendingY) window.scrollTo(0, pendingY)
            windowY = window.scrollY
            settleScroll?.disconnect()
          })
        : undefined
    settleScroll?.observe(element)
    const settleScrollTimer = settleScroll ? window.setTimeout(() => settleScroll.disconnect(), 5000) : undefined
    window.addEventListener('scroll', onScroll, { passive: true })
    element.addEventListener('focusin', onFocus)
    // A scroll event can still be pending when a click starts navigation; read the position before the click is handled.
    document.addEventListener('click', onScroll, true)
    const capture = (live = false) => {
      if (live) {
        windowY = window.scrollY
        if (element.contains(document.activeElement)) focusId = document.activeElement?.id || undefined
      }
      const state: ScreenState = {
        windowY,
        scroll: scrollElements().map(item => [item.scrollTop, item.scrollLeft]),
        open: Object.fromEntries(Array.from(element.querySelectorAll('details')).map(item => [detailKey(item), item.open])),
        focusId,
      }
      screens.set(memoryKey, state)
      try {
        sessionStorage.setItem(`code-reps:screen:${memoryKey}`, JSON.stringify(state))
      } catch {
        /* Continue without session persistence. */
      }
    }
    // A lazy page replaces its loading heading after arrival; if that drops focus to the body, hand it to the new heading.
    // Watching ends once no loading placeholder remains, so a slow load keeps the handoff without a fixed short window.
    // The first run's cleanup saves state, so a repeat run would otherwise see a restore and drop the handoff.
    if (!repeat) shownHandoff = navigated && !saved
    const settle =
      shownHandoff && typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            if (document.activeElement === document.body) element.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
            if (!element.querySelector('[aria-busy="true"]')) settle?.disconnect()
          })
        : undefined
    settle?.observe(element, { childList: true, subtree: true })
    const settleTimer = settle ? window.setTimeout(() => settle.disconnect(), 30000) : undefined
    const captureLive = () => capture(true)
    window.addEventListener('pagehide', captureLive)
    return () => {
      settle?.disconnect()
      window.clearTimeout(settleTimer)
      settleScroll?.disconnect()
      window.clearTimeout(settleScrollTimer)
      window.removeEventListener('scroll', onScroll)
      element.removeEventListener('focusin', onFocus)
      document.removeEventListener('click', onScroll, true)
      capture()
      window.removeEventListener('pagehide', captureLive)
    }
  }, [memoryKey])
  return (
    <div ref={root} className="screen-content screen-motion">
      {children}
    </div>
  )
}

type DrawerProps = {
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
  closeRequest?: { current: (() => void) | null }
}
export function SearchDrawer({ title, children, onClose, className = '', closeRequest }: DrawerProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closing = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  function requestClose() {
    if (closing.current) return
    closing.current = true
    dialog.current?.close()
    // Keep the closed native dialog mounted while its shared CSS exit completes.
    if (reducedMotion()) onClose()
    else timer.current = window.setTimeout(onClose, 180)
  }
  useImperativeHandle(closeRequest, () => requestClose)
  useEffect(() => {
    const node = dialog.current!
    node.showModal()
    // showModal focuses the first control (Close); a search drawer starts in its field so typing searches at once.
    node.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => {
      window.clearTimeout(timer.current)
      node.close()
    }
  }, [])
  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
      event.preventDefault()
      event.stopPropagation()
      requestClose()
    }
  }
  // A click on the backdrop lands on the dialog itself, outside its box.
  function onClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return
    const box = event.currentTarget.getBoundingClientRect()
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) requestClose()
  }
  return (
    <dialog
      ref={dialog}
      className={`utility-dialog ${className}`}
      aria-label={title}
      onKeyDown={onKeyDown}
      onCancel={event => {
        event.preventDefault()
        requestClose()
      }}
      onClick={onClick}
    >
      <div className="utility-heading">
        <h2>{title}</h2>
        <button type="button" onClick={requestClose} aria-label={`Close ${title}`}>
          <Icon name="close" />
          Close <kbd>Esc</kbd>
        </button>
      </div>
      {children}
    </dialog>
  )
}

export function GlossaryDrawer({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const glossary = useGlossary()
  const terms = glossary.status === 'ready' ? glossary.terms : []
  const visible = terms.filter(item => `${item.term} ${item.meaning}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <SearchDrawer title="Quick glossary" className="glossary-drawer" onClose={onClose}>
      <label className="field-label" htmlFor="glossary-query">
        Find a term
      </label>
      <Input
        id="glossary-query"
        type="search"
        data-autofocus
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="Try index, map, or frequency"
      />
      <p className="utility-note">Definitions stay available while you practice.</p>
      {glossary.status === 'loading' && <p role="status">Loading the glossary…</p>}
      {glossary.status === 'error' && (
        <div role="alert">
          <p>The glossary could not load. Your work is safe.</p>
          <Button variant="text" onClick={glossary.retry}>
            Retry
          </Button>
        </div>
      )}
      <dl className="glossary-list">
        {visible.map(item => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>{item.meaning}</dd>
          </div>
        ))}
      </dl>
      {glossary.status === 'ready' && !visible.length && <p>No matching terms. Try a shorter search.</p>}
    </SearchDrawer>
  )
}

type PaletteProps = {
  /** Entries that depend on where the learner is: what to continue, this rep's actions, and settings. */
  context: SearchEntry[]
  onChoose: (target: SearchTarget) => void
  onClose: () => void
}
export function CommandPalette({ context, onChoose, onClose }: PaletteProps) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const closeRequest = useRef<(() => void) | null>(null)
  const sections = searchPalette(query, context)
  const matches = sections.flatMap(section => section.entries)
  const execute = (entry: SearchEntry) => {
    closeRequest.current?.()
    requestAnimationFrame(() => onChoose(entry.target))
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(index => Math.max(0, Math.min(matches.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))))
    }
    if (event.key === 'Enter' && matches[active]) {
      event.preventDefault()
      execute(matches[active])
    }
  }
  useEffect(() => {
    document.getElementById(`command-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])
  // Each option's place in the flat list the arrow keys move through.
  const starts = sections.map((_, i) => sections.slice(0, i).reduce((sum, section) => sum + section.entries.length, 0))
  return (
    <SearchDrawer title="Search" className="command-palette" onClose={onClose} closeRequest={closeRequest}>
      <label htmlFor="command-query" className="visually-hidden">
        Search pages, lessons, exercises, and settings
      </label>
      <Input
        id="command-query"
        type="search"
        data-autofocus
        value={query}
        onChange={event => {
          setQuery(event.target.value)
          setActive(0)
        }}
        role="combobox"
        aria-expanded="true"
        aria-controls="command-results"
        aria-autocomplete="list"
        aria-activedescendant={matches.length ? `command-${active}` : undefined}
        placeholder="Find a lesson, exercise, page, or setting"
        onKeyDown={onKeyDown}
      />
      <div id="command-results" role="listbox" aria-label="Results" className="command-results">
        {sections.map((section, sectionIndex) => (
          <div key={section.group} role="group" aria-labelledby={`command-group-${section.group.replace(' ', '-')}`}>
            <p className="command-group" id={`command-group-${section.group.replace(' ', '-')}`} role="presentation">
              {section.group}
            </p>
            {section.entries.map((entry, entryIndex) => {
              const position = starts[sectionIndex] + entryIndex
              return (
                <div
                  key={`${section.group}:${entry.label}`}
                  id={`command-${position}`}
                  role="option"
                  aria-selected={position === active}
                  onMouseEnter={() => setActive(position)}
                >
                  <button type="button" tabIndex={-1} onClick={() => execute(entry)}>
                    <span>{entry.label}</span>
                    {entry.detail && <small>{entry.detail}</small>}
                    {entry.shortcut && <kbd>{entry.shortcut}</kbd>}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {!matches.length && (
        <p className="command-empty" role="status">
          Nothing matches “{query.trim()}”. Try a shorter word, or browse the Library.
        </p>
      )}
      <p className="command-keys" aria-hidden="true">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> to move
        </span>
        <span>
          <kbd>Enter</kbd> to open
        </span>
        <span>
          <kbd>Esc</kbd> to close
        </span>
      </p>
    </SearchDrawer>
  )
}

function formatValue(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function ValueDifference({ value, other }: { value: string; other: string }) {
  const lines = formatValue(value).split('\n')
  const comparison = formatValue(other).split('\n')
  return (
    <pre>
      {lines.map((line, index) => (
        <span key={index} className={line === comparison[index] ? '' : 'diff-line'}>
          {line}
          {index < lines.length - 1 ? '\n' : ''}
        </span>
      ))}
    </pre>
  )
}

/** Failed checks first, one diagnostic open at a time, then the passed checks. Stale results are a dimmed reference. */
export function CheckFeedback({
  results,
  stale = false,
  open,
  onOpen,
}: {
  results: TestResult[]
  stale?: boolean
  /** The failed check shown open. Owned by the caller so it survives a run going out of date. */
  open?: string | null
  onOpen?: (name: string | null) => void
}) {
  const failed = results.filter(result => !result.passed)
  const passed = results.filter(result => result.passed)
  const [ownOpen, setOwnOpen] = useState<string | null>(() => failed[0]?.name ?? null)
  const activeFailed = open === undefined ? ownOpen : open
  const setActiveFailed = (next: (current: string | null) => string | null) => {
    const value = next(activeFailed)
    setOwnOpen(value)
    onOpen?.(value)
  }
  const row = (result: TestResult) => (
    <li key={result.name}>
      <span
        className={result.passed ? 'pass-icon' : 'fail-icon'}
        aria-label={`${result.passed ? 'Passed' : 'Failed'}${stale ? ' in the last run' : ''}`}
      >
        <Icon name={result.passed ? 'check' : 'close'} />
      </span>
      <div>
        {result.passed ? (
          <>
            <strong>{result.name}</strong>
            {result.plan && (
              <Suspense fallback={null}>
                <SqlPlan lines={result.plan} />
              </Suspense>
            )}
          </>
        ) : (
          <details
            open={activeFailed === result.name}
            onToggle={event => {
              const open = event.currentTarget.open
              setActiveFailed(current => (open ? result.name : current === result.name ? null : current))
            }}
          >
            <FailedCheck result={result} stale={stale} />
          </details>
        )}
      </div>
      {result.passed && <span className="check-outcome">{stale ? 'Passed last run' : 'Passed'}</span>}
    </li>
  )
  return (
    <>
      {!!failed.length && <ul className={`result-list${stale ? ' is-stale' : ''}`}>{failed.map(row)}</ul>}
      {!!passed.length && (
        <ul
          className={`result-list passed-checks${stale ? ' is-stale' : ''}`}
          aria-label={stale ? 'Passed in the last run' : 'Passed checks'}
        >
          {passed.map(row)}
        </ul>
      )}
    </>
  )
}

/** The input, expected and actual values, and message for one failed check. */
function FailedCheck({ result, stale }: { result: TestResult; stale: boolean }) {
  const actual = result.actual ?? 'No returned value'
  return (
    <>
      <summary>{result.name}</summary>
      {result.input?.startsWith('Starting data: ') ? (
        <p className="sql-starting">{result.input}</p>
      ) : (
        result.input && (
          <div>
            <span className="field-label">Input</span>
            <pre>{result.input}</pre>
          </div>
        )
      )}
      {!!result.tables?.length && (
        <Suspense fallback={<p className="utility-note">Loading the row comparison…</p>}>
          {result.tables.map(table => (
            <SqlComparison key={table.label} table={table} stale={stale} />
          ))}
        </Suspense>
      )}
      {result.plan && (
        <Suspense fallback={<pre>{result.plan.join('\n')}</pre>}>
          <SqlPlan lines={result.plan} />
        </Suspense>
      )}
      {result.expected !== undefined && (
        <div className="value-comparison">
          <div>
            <span className="field-label">Expected</span>
            <ValueDifference value={result.expected} other={actual} />
          </div>
          <div>
            <span className="field-label">{stale ? 'Actual (last run)' : 'Actual'}</span>
            <ValueDifference value={actual} other={result.expected} />
          </div>
        </div>
      )}
      {result.message &&
        (!result.tables?.length || result.plan) &&
        !(result.expected !== undefined && result.message.startsWith('Expected ')) && <p>{result.message}</p>}
      {!stale && <p className="utility-note">Trace this input through your code, then try again.</p>}
    </>
  )
}

type SplitProps = { value: number; onChange: (value: number) => void; onCommit: (value: number) => void }
export function WorkspaceSplit({ value, onChange, onCommit }: SplitProps) {
  const stop = useRef<(() => void) | null>(null)
  useEffect(() => () => stop.current?.(), [])
  const commit = (next: number) => {
    onChange(next)
    onCommit(next)
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    commit(event.key === 'Home' ? 25 : event.key === 'End' ? 60 : Math.max(25, Math.min(60, value + (event.key === 'ArrowLeft' ? -2 : 2))))
  }
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    const parent = event.currentTarget.parentElement!
    let width = value
    const move = (next: globalThis.PointerEvent) => {
      const box = parent.getBoundingClientRect()
      width = Math.max(25, Math.min(60, Math.round(((next.clientX - box.left) / box.width) * 100)))
      onChange(width)
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      document.body.classList.remove('resizing-workspace')
      stop.current = null
      onCommit(width)
    }
    stop.current?.()
    stop.current = end
    document.body.classList.add('resizing-workspace')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }
  return (
    <div
      className="workspace-split"
      role="separator"
      aria-label="Resize brief and editor"
      aria-orientation="vertical"
      aria-valuemin={25}
      aria-valuemax={60}
      aria-valuenow={value}
      tabIndex={0}
      onDoubleClick={() => commit(40)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
    >
      <span />
    </div>
  )
}
