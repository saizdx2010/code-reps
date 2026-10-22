import { Button } from './Button'
import { lazy, Suspense } from 'react'
import { closeOnAction, closeOnEscape } from './menu-close'
import type { RepSummary } from './catalog-index'
import type { RepOrigin } from './rep-origin'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import { repCurriculumRole } from './curriculum'
import { effortRange } from './rep-guidance'
import { repLevelLabel } from './rep-levels.ts'
import { skillSummariesForRep as skillsForRep } from './skill-index'
import { statusTone } from './ui-status'

// Previous, next, and the switcher load just after the header; the header works without them.
const RepStepper = lazy(() => import('./RepStepper'))

/** The single compact header row of the coding desk. */
export function WorkspaceHeader({
  rep,
  status,
  saveState,
  focusMode,
  vimKeys,
  onVimKeys,
  onBack,
  backLabel,
  backToLesson,
  origin,
  goalPathId,
  repStatus,
  openRep,
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
  /** Vim keys in the code editor, a setting kept on this device. */
  vimKeys: boolean
  onVimKeys: () => void
  /** Returns to the page or lesson the rep was opened from. */
  onBack: () => void
  backLabel: string
  /** The back link names a lesson, so it carries the lesson's book mark. */
  backToLesson: boolean
  /** Where the rep was opened from; the stepper walks the same list. */
  origin: RepOrigin
  goalPathId: string
  repStatus: (id: string) => string
  openRep: (id: string) => void
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
          onClick={onBack}
          aria-label={backToLesson ? `Back to the lesson ${backLabel}` : `Back to ${backLabel}`}
        >
          <Icon name="left" />
          {backToLesson && <Icon name="book" />}
          <span className="breadcrumb-lesson">{backLabel}</span>
        </button>
        <Suspense fallback={null}>
          <RepStepper repId={rep.id} origin={origin} goalPathId={goalPathId} repStatus={repStatus} openRep={openRep} />
        </Suspense>
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
            <Button onClick={onVimKeys}>{vimKeys ? 'Turn off Vim keys' : 'Vim keys'}</Button>
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
