import { useState } from 'react'
import type { Ref } from 'react'
import { CheckFeedback } from './Experience'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import { skillSummariesForRep } from './skill-index.ts'
import type { TestResult } from './runner.types'

type CheckRun = { results: TestResult[] | null; staleResults: TestResult[] | null; runError: string; running: boolean; runNotice: string }

const passedCount = (results: TestResult[]) => results.filter(result => result.passed).length

/** The checks drawer at the foot of the code column: run state, results, and help for failed checks. */
export function ChecksDrawer({
  run,
  allPassed,
  checkCount,
  open,
  onToggle,
  completed,
  repId,
  openLesson,
  onExplain,
  explaining,
}: {
  run: CheckRun
  allPassed: boolean
  checkCount?: number
  open: boolean
  onToggle: () => void
  completed: boolean
  repId: string
  openLesson: (id: string) => void
  onExplain: () => void
  /** The Explain step is open or already written, so the drawer does not offer to go there. */
  explaining: boolean
}) {
  const { results, staleResults, runError, running, runNotice } = run
  const stale = !running && !results && !runError ? staleResults : null
  const state = running ? 'running' : runError ? 'failed' : results ? (allPassed ? 'passed' : 'failed') : stale ? 'stale' : ''
  const summary = running
    ? 'Running…'
    : results
      ? `${passedCount(results)} of ${results.length} passed`
      : runError
        ? 'Needs attention'
        : stale
          ? `Last run: ${passedCount(stale)} of ${stale.length} passed`
          : 'Not run yet'
  // The open failed case follows the learner from a fresh run into its out-of-date reference.
  const shown = results ?? stale
  const firstFailed = shown?.find(result => !result.passed)?.name ?? null
  const [openCase, setOpenCase] = useState<{ run: TestResult[] | null; name: string | null }>({ run: null, name: null })
  const openName = openCase.run === shown ? openCase.name : firstFailed
  const chooseCase = (name: string | null) => setOpenCase({ run: shown, name })
  // One direct lesson for the rep, never a guess from check names, and nothing when the rep has none.
  const lesson = skillSummariesForRep(repId)[0]
  return (
    <section
      id="checks-section"
      tabIndex={-1}
      className={`checks-drawer ${state}`}
      aria-live="polite"
      aria-busy={running}
      onKeyDown={event => {
        // Escape lowers the open results (on phones, the sheet over the editor) and returns focus to the toggle.
        if (event.key !== 'Escape' || !open || event.defaultPrevented) return
        event.preventDefault()
        onToggle()
        event.currentTarget.querySelector<HTMLButtonElement>('.checks-toggle')?.focus()
      }}
    >
      <button type="button" className="checks-toggle" aria-expanded={open} aria-controls="check-details" onClick={onToggle}>
        <span>Checks</span>
        <span>
          {stale && <StatusChip>Out of date</StatusChip>}
          {open && results && !running ? null : summary} <Icon name="chevron" />
        </span>
      </button>
      <div id="check-details" hidden={!open}>
        {running ? (
          <div className="result-running">
            <span className="result-running-track" aria-hidden="true">
              <span />
            </span>
            <strong>Running checks</strong>
            <p>Checking your solution against {checkCount} cases.</p>
          </div>
        ) : runError ? (
          <div className="error-message" role="alert">
            {runError}
          </div>
        ) : results ? (
          <>
            <div className={`result-summary ${allPassed ? 'passed' : 'failed'}`}>
              <span>
                <Icon name={allPassed ? 'check' : 'alert'} />
              </span>
              <div>
                <strong>{allPassed ? 'All checks passed' : `${passedCount(results)} of ${results.length} checks passed`}</strong>
              </div>
              {allPassed && !completed && !explaining && (
                <button type="button" className="primary-button checks-next" onClick={onExplain}>
                  Explain your solution
                  <Icon name="arrow" />
                </button>
              )}
            </div>
            <CheckFeedback results={results} open={openName} onOpen={chooseCase} />
            {!allPassed && lesson && (
              <p className="mistake-help">
                <Icon name="book" />
                <span>Stuck? Review</span>
                <button type="button" className="text-button" onClick={() => openLesson(lesson.id)}>
                  {lesson.title}
                  <Icon name="arrow" />
                </button>
              </p>
            )}
          </>
        ) : stale ? (
          <div className="stale-results">
            <p className="stale-note">
              Your code changed since this run. The results stay here for reference; run again to check your edit.
            </p>
            <CheckFeedback results={stale} stale open={openName} onOpen={chooseCase} />
          </div>
        ) : (
          <div className="empty-results">
            <span className="empty-icon">
              <Icon name="code" />
            </span>
            <div>
              <strong>{runNotice ? 'Run checks again when ready' : 'Ready when you are'}</strong>
              <p>{runNotice || 'Run checks to see how your solution handles the examples and edge cases.'}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/** The run bar under the code column. Its height is measured to lay out the coding desk. */
export function WorkspaceToolbar({
  ref,
  run,
  canRun,
  onRun,
  onStop,
  onResults,
}: {
  ref: Ref<HTMLDivElement>
  run: CheckRun
  canRun: boolean
  onRun: () => void
  onStop: () => void
  onResults: () => void
}) {
  const { results, staleResults, runError, running } = run
  const stale = !running && !results && !runError && staleResults
  return (
    <div ref={ref} className="workspace-toolbar">
      <div className="workspace-toolbar-links">
        {(results || runError || stale) && (
          <button type="button" onClick={onResults}>
            {stale ? 'Last results' : results?.some(result => !result.passed) ? 'View failed checks' : 'Results'}
          </button>
        )}
      </div>
      <div className={`workspace-toolbar-run${stale ? ' is-stale' : ''}`}>
        <span role="status">
          {running
            ? 'Running checks…'
            : results
              ? `${passedCount(results)}/${results.length} passed`
              : stale
                ? 'Run again to check your edit'
                : 'Ready to run'}
        </span>
        {running ? (
          <button type="button" className="stop-checks-button" onClick={onStop}>
            Stop checks
          </button>
        ) : (
          <button className="primary-button" type="button" disabled={!canRun} onClick={onRun}>
            <Icon name="play" />
            Run checks
          </button>
        )}
      </div>
    </div>
  )
}
