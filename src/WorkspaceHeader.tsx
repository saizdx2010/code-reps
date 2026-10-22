import { Button } from './Button'
import type { KeyboardEvent, MouseEvent } from 'react'
import type { RepSummary } from './catalog-index'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import { repCurriculumRole } from './curriculum'
import { effortRange } from './rep-guidance'
import { repLevelLabel } from './rep-levels.ts'
import { skillSummariesForRep as skillsForRep } from './skill-index'
import { statusTone } from './ui-status'

// The Tools menu closes once an action is chosen, and Escape returns focus to its summary.
function closeOnAction(event: MouseEvent<HTMLDetailsElement>) {
  if ((event.target as HTMLElement).closest('button')) event.currentTarget.open = false
}
function closeOnEscape(event: KeyboardEvent<HTMLDetailsElement>) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  event.currentTarget.open = false
  event.currentTarget.querySelector('summary')?.focus()
}

/** The single compact header row of the coding desk. */
export function WorkspaceHeader({
  rep,
  status,
  saveState,
  focusMode,
  onLibrary,
  backLabel,
  onGlossary,
  onFocusMode,
  onReset,
  openLesson,
  runLabel,
}: {
  rep: RepSummary
  status: string
  saveState: string
  focusMode: boolean
  onLibrary: () => void
  /** The lesson this rep was opened from; the back link returns there instead of the Library. */
  backLabel?: string
  onGlossary: () => void
  onFocusMode: () => void
  onReset: () => void
  openLesson: (id: string) => void
  /** A running warm-up or Today set: where this rep sits in it. */
  runLabel?: string
}) {
  const skills = skillsForRep(rep.id)
  // The trail's role travels with the rep, so a recall or independent rep never looks like a first try.
  const role = repCurriculumRole(rep.id)
  return (
    <header className="workspace-header">
      <div className="workspace-title">
        <button
          type="button"
          className="breadcrumb-link"
          onClick={onLibrary}
          aria-label={backLabel ? `Back to the lesson ${backLabel}` : undefined}
        >
          <Icon name="left" />
          {backLabel ? (
            <>
              <Icon name="book" />
              <span className="breadcrumb-lesson">{backLabel}</span>
            </>
          ) : (
            'Library'
          )}
        </button>
        <h1 tabIndex={-1}>{rep.title}</h1>
        {repLevelLabel(rep.id) && <StatusChip>{repLevelLabel(rep.id)}</StatusChip>}
        {role !== 'Application' && <StatusChip>{role}</StatusChip>}
        <StatusChip tone={statusTone(status)}>{status}</StatusChip>
        {runLabel && <StatusChip tone="progress">{runLabel}</StatusChip>}
        <span className="workspace-category">
          {rep.category} ·{' '}
          {effortRange(rep.id)
            .replace(/, plus time to build$/, '')
            .replace(' minutes', ' min')}
        </span>
      </div>
      <div className="workspace-actions">
        <p className="workspace-save-status" role="status">
          {saveState}
        </p>
        <Button aria-haspopup="dialog" onClick={onGlossary}>
          Glossary
        </Button>
        <details className="workspace-options" onClick={closeOnAction} onKeyDown={closeOnEscape}>
          <summary>Tools</summary>
          <div>
            <Button onClick={onFocusMode}>{focusMode ? 'Exit focus' : 'Focus mode'}</Button>
            <Button onClick={onReset}>Reset rep</Button>
            {skills.length > 0 && (
              <div className="workspace-knowledge">
                <span>Related concepts</span>
                {skills.slice(0, 3).map(skill => (
                  <button type="button" key={skill.id} onClick={() => openLesson(skill.id)}>
                    {skill.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </details>
      </div>
    </header>
  )
}
