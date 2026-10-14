import type { KeyboardEvent, MouseEvent } from 'react'
import type { RepSummary } from './catalog-index'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
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
  onGlossary,
  onFocusMode,
  onReset,
  openLesson,
}: {
  rep: RepSummary
  status: string
  saveState: string
  focusMode: boolean
  onLibrary: () => void
  onGlossary: () => void
  onFocusMode: () => void
  onReset: () => void
  openLesson: (id: string) => void
}) {
  const skills = skillsForRep(rep.id)
  return (
    <header className="workspace-header">
      <div className="workspace-title">
        <button type="button" className="breadcrumb-link" onClick={onLibrary}>
          <Icon name="left" />
          Library
        </button>
        <h1 tabIndex={-1}>{rep.title}</h1>
        {repLevelLabel(rep.id) && <StatusChip>{repLevelLabel(rep.id)}</StatusChip>}
        <StatusChip tone={statusTone(status)}>{status}</StatusChip>
        <span className="workspace-category">{rep.category}</span>
      </div>
      <div className="workspace-actions">
        <p className="workspace-save-status" role="status">
          {saveState}
        </p>
        <button className="reset-button" type="button" onClick={onGlossary}>
          Glossary
        </button>
        <details className="workspace-options" onClick={closeOnAction} onKeyDown={closeOnEscape}>
          <summary>Tools</summary>
          <div>
            <button className="reset-button" type="button" onClick={onFocusMode}>
              {focusMode ? 'Exit focus' : 'Focus mode'}
            </button>
            <button className="reset-button" type="button" onClick={onReset}>
              Reset rep
            </button>
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
