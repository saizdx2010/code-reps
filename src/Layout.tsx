import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { ChipTone } from './ui-status'
import './layout.css'

/** Compact page title with one line of context and optional actions. Owns the page h1 used by skip links. */
export function PageHeader({ title, description, actions, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return <header className="page-header">
    <div>
      {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
      <h1 tabIndex={-1}>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </header>
}

/** Secondary explanation kept out of body text. Native disclosure keeps keyboard and screen-reader behavior. */
export function InfoNote({ label = 'How evidence works', children }: { label?: string; children: ReactNode }) {
  return <details className="info-note">
    <summary><Icon name="info" /><span>{label}</span></summary>
    <div className="info-note-body">{children}</div>
  </details>
}

export function StatusChip({ tone = 'neutral', children }: { tone?: ChipTone; children: ReactNode }) {
  // A new status remounts the chip so it settles in; an unchanged status stays still.
  return <span key={typeof children === 'string' ? children : tone} className={`status-chip chip-${tone}`}>{children}</span>
}

export function EmptyState({ title, children, action }: { title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return <div className="empty-state">
    <strong>{title}</strong>
    {children && <p>{children}</p>}
    {action}
  </div>
}

/** A collapsible group of rows. Native details semantics; open state may be controlled by a session preference. */
export function ListGroup({ title, count, open, onToggle, children }: { title: ReactNode; count?: number; open?: boolean; onToggle?: (open: boolean) => void; children: ReactNode }) {
  return <details className="list-group" open={open} onToggle={event => onToggle?.(event.currentTarget.open)}>
    <summary><span className="list-group-title">{title}</span>{count !== undefined && <span className="list-group-count">{count}</span>}<Icon name="chevron" /></summary>
    <ul className="list-rows">{children}</ul>
  </details>
}

/** One row style for exercises, lessons, journal entries, and skills. */
export function ListRow({ title, meta, status, current, onOpen, onPreview, action }: { title: ReactNode; meta?: ReactNode; status?: ReactNode; current?: boolean; onOpen?: () => void; onPreview?: () => void; action?: ReactNode }) {
  const body = <><span className="list-row-text"><strong>{title}</strong>{meta && <small>{meta}</small>}</span>{status && <span className="list-row-status">{status}</span>}</>
  return <li className="list-row">
    {onOpen ? <button type="button" aria-current={current ? 'step' : undefined} onClick={onOpen} onMouseEnter={onPreview} onFocus={onPreview}>{body}<Icon name="arrow" /></button> : <div>{body}{action}</div>}
  </li>
}
