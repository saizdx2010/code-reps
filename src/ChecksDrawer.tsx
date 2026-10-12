import type { Ref } from 'react'
import { CheckFeedback } from './Experience'
import { relatedHelp } from './fluency'
import { Icon } from './Icon'
import type { TestResult } from './runner.types'

type CheckRun = { results: TestResult[] | null; runError: string; running: boolean; runNotice: string }

const passedCount = (results: TestResult[]) => results.filter(result => result.passed).length

/** The checks drawer at the foot of the code column: run state, results, and help for failed checks. */
export function ChecksDrawer({ run, allPassed, checkCount, open, onToggle, completed, repId, openLesson, onExplain }: {
  run: CheckRun; allPassed: boolean; checkCount?: number; open: boolean; onToggle: () => void; completed: boolean
  repId: string; openLesson: (id: string) => void; onExplain: () => void
}) {
  const { results, runError, running, runNotice } = run
  const state = running ? 'running' : runError ? 'failed' : results ? allPassed ? 'passed' : 'failed' : ''
  const summary = running ? 'Running…'
    : results ? `${passedCount(results)} of ${results.length} passed` : runError ? 'Needs attention' : 'Not run yet'
  return <section id="checks-section" tabIndex={-1} className={`checks-drawer ${state}`} aria-live="polite" aria-busy={running}>
    <button type="button" className="checks-toggle" aria-expanded={open} aria-controls="check-details" onClick={onToggle}>
      <span>Checks</span>
      <span>{summary} <Icon name="chevron" /></span>
    </button>
    <div id="check-details" hidden={!open}>
      {running ? <div className="result-running">
        <span className="result-running-track" aria-hidden="true"><span /></span>
        <strong>Running checks</strong>
        <p>Checking your solution against {checkCount} cases.</p>
      </div> : runError ? <div className="error-message" role="alert">{runError}</div> : results ? <>
        <div className={`result-summary ${allPassed ? 'passed' : 'failed'}`}>
          <span><Icon name={allPassed ? 'check' : 'alert'} /></span>
          <div><strong>{allPassed ? 'All checks passed' : `${passedCount(results)} of ${results.length} checks passed`}</strong></div>
        </div>
        <CheckFeedback results={results} />
        {allPassed && !completed && <button type="button" className="primary-button checks-next" onClick={onExplain}>
          Explain your solution
        </button>}
        {!allPassed && <aside className="mistake-help">
          <h3>Explore the concepts behind these checks</h3>
          <p>These references may help you trace the failure. They are suggestions, not a diagnosis of your code.</p>
          {relatedHelp(repId, results.filter(result => !result.passed).map(result => result.name)).map(skill => <div key={skill.id}>
            <button type="button" onClick={() => openLesson(skill.id)}>{skill.title}</button>
            <p>{skill.firstMistake}</p>
          </div>)}
        </aside>}
      </> : <div className="empty-results">
        <span className="empty-icon"><Icon name="code" /></span>
        <div>
          <strong>{runNotice ? 'Run checks again when ready' : 'Ready when you are'}</strong>
          <p>{runNotice || 'Run checks to see how your solution handles the examples and edge cases.'}</p>
        </div>
      </div>}
    </div>
  </section>
}

/** The run bar under the code column. Its height is measured to lay out the coding desk. */
export function WorkspaceToolbar({ ref, run, canRun, onRun, onStop, onResults }: {
  ref: Ref<HTMLDivElement>; run: CheckRun; canRun: boolean; onRun: () => void; onStop: () => void; onResults: () => void
}) {
  const { results, runError, running } = run
  return <div ref={ref} className="workspace-toolbar">
    <div className="workspace-toolbar-links">{(results || runError) && <button type="button" onClick={onResults}>
      {results?.some(result => !result.passed) ? 'View failed checks' : 'Results'}
    </button>}</div>
    <div className="workspace-toolbar-run">
      <span role="status">
        {running ? 'Running checks…' : results ? `${passedCount(results)}/${results.length} passed` : 'Ready to run'}
      </span>
      {running
        ? <button type="button" className="stop-checks-button" onClick={onStop}>Stop checks</button>
        : <button className="primary-button" type="button" disabled={!canRun} onClick={onRun}><Icon name="play" />Run checks</button>}
    </div>
  </div>
}
