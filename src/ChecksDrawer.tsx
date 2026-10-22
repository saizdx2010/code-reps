import { Button } from './Button'
import { lazy, Suspense, useEffect, useState } from 'react'
import type { Ref } from 'react'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import { skillSummariesForRep } from './skill-index.ts'
import type { SqlError, TestResult } from './runner.types'
import { judgeCalls, noCalls, surprisesFirst } from './check-calls.ts'
import type { Call, CallVerdict, Calls } from './check-calls.ts'
import { typeCheckSummary } from './type-issues'
import { useSessionPreference } from './useSessionPreference'
import type { TypeIssue } from './type-issues'

type CheckRun = {
  results: TestResult[] | null
  staleResults: TestResult[] | null
  runError: string
  running: boolean
  loadingEngine?: boolean
  runNotice: string
}

// The result rows load with the first run: starting a run fetches them, so they are ready when results arrive.
const loadCheckResults = () => import('./CheckResults')
const CheckFeedback = lazy(() =>
  loadCheckResults()
    .then(module => ({ default: module.CheckFeedback }))
    .catch(() => ({
      default: ({ results }: { results: TestResult[] }) => (
        <ul className="result-list">
          {results.map(result => (
            <li key={result.name}>
              {result.passed ? 'Passed' : 'Failed'}: {result.name}
            </li>
          ))}
        </ul>
      ),
    })),
)

const passedCount = (results: TestResult[]) => results.filter(result => result.passed).length

// SQLite's complaint about the query text loads with the first one. Without it, the message still shows as text.
const SqlErrorBox = lazy(() =>
  import('./SqlResults')
    .then(module => ({ default: module.SqlErrorBox }))
    .catch(() => ({ default: ({ error }: { error: SqlError }) => <p>{error.message}</p> })),
)

/** The same SQLite complaint on every check means SQLite could not run the query at all, whatever the data. */
function sharedSqlError(results: TestResult[] | null): SqlError | undefined {
  const first = results?.[0]?.sqlError
  return first && results!.every(result => !result.passed && result.sqlError?.message === first.message) ? first : undefined
}

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
  neverCompleted = false,
  probes = false,
  typeIssues,
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
  /** No attempt at this rep has ever been completed, so its first all-green run can say so. */
  neverCompleted?: boolean
  /** Every check of a schema rep is a probe of one rule, so the summary counts probes. */
  probes?: boolean
  /** The editor's TypeScript errors; undefined until the editor reports, and null when the rep is not TypeScript. */
  typeIssues?: TypeIssue[] | null
}) {
  const { results, staleResults, runError, running, loadingEngine, runNotice } = run
  const stale = !running && !results && !runError ? staleResults : null
  const state = running ? 'running' : runError ? 'failed' : results ? (allPassed ? 'passed' : 'failed') : stale ? 'stale' : ''
  const sqlError = sharedSqlError(results)
  const summary = running
    ? 'Running…'
    : sqlError
      ? 'SQLite could not run the query'
      : results
        ? `${passedCount(results)} of ${results.length} passed`
        : runError
          ? 'Needs attention'
          : stale
            ? `Last run: ${passedCount(stale)} of ${stale.length} passed`
            : 'Not run yet'
  // The open failed case follows the learner from a fresh run into its out-of-date reference.
  const shown = results ?? stale
  // Calls made before a run are judged against that run once, then cleared, so each run starts without calls.
  const [callState, setCallState] = useState<{ repId: string } & Calls>({ repId, checks: {} })
  const calls: Calls = callState.repId === repId ? callState : { checks: {} }
  const setCalls = (next: Calls) => setCallState({ repId, ...next })
  const [judged, setJudged] = useState<{ results: TestResult[]; verdict: CallVerdict | null } | null>(null)
  if (results && judged?.results !== results) {
    setJudged({ results, verdict: judgeCalls(calls, results) })
    if (!noCalls(calls)) setCalls({ checks: {} })
  }
  const verdict = results && judged?.results === results ? judged.verdict : null
  // A run that ends in an error judges nothing; its calls are dropped rather than left unseen for a later run.
  if (runError && !noCalls(calls)) setCalls({ checks: {} })
  useEffect(() => {
    if (running) void loadCheckResults().catch(() => {})
  }, [running])
  const firstFailed = surprisesFirst(shown?.filter(result => !result.passed) ?? [], verdict)[0]?.name ?? null
  const [openCase, setOpenCase] = useState<{ run: TestResult[] | null; name: string | null }>({ run: null, name: null })
  const openName = openCase.run === shown ? openCase.name : firstFailed
  const chooseCase = (name: string | null) => setOpenCase({ run: shown, name })
  // The first all-green run of a never-completed rep this browser session says so, once. Runs are not stored, so the
  // claim is limited to the session: the reps it was shown for are a session preference, never part of a backup.
  const [firstGreen, setFirstGreen] = useState<{ repId: string; results: TestResult[] } | null>(null)
  const [greenReps, setGreenReps] = useSessionPreference<string>('first-green', '')
  const greenBefore = greenReps.split(',').includes(repId)
  if (results && allPassed && neverCompleted && !completed && firstGreen?.repId !== repId && !greenBefore) setFirstGreen({ repId, results })
  useEffect(() => {
    if (firstGreen && !greenReps.split(',').includes(firstGreen.repId))
      setGreenReps([greenReps, firstGreen.repId].filter(Boolean).join(','))
  }, [firstGreen, greenReps, setGreenReps])
  const firstGreenRun = !!results && firstGreen?.repId === repId && firstGreen.results === results
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
            {loadingEngine ? (
              <>
                <strong className="is-loading">Loading SQLite</strong>
                <p>
                  The database engine loads before the checks run. Then each of the {checkCount} checks runs against its own fresh database.
                </p>
              </>
            ) : (
              <>
                <strong className="is-loading">Running checks</strong>
                <p>Checking your solution against {checkCount} cases.</p>
              </>
            )}
          </div>
        ) : runError ? (
          <div className="error-message" role="alert">
            {runError}
          </div>
        ) : sqlError ? (
          <>
            <div className="result-summary failed">
              <span>
                <Icon name="alert" />
              </span>
              <div>
                <strong>SQLite could not run the query</strong>
              </div>
            </div>
            <Suspense fallback={<p>{sqlError.message}</p>}>
              <SqlErrorBox error={sqlError} />
            </Suspense>
          </>
        ) : results ? (
          <>
            <div className={`result-summary ${allPassed ? 'passed' : 'failed'}`}>
              <span>
                <Icon name={allPassed ? 'check' : 'alert'} play={allPassed ? 'passed' : 'failed'} />
              </span>
              <div>
                <strong>
                  {probes
                    ? allPassed
                      ? 'All probes behaved as the contract says'
                      : `${passedCount(results)} of ${results.length} probes behaved as the contract says`
                    : allPassed
                      ? 'All checks passed'
                      : `${passedCount(results)} of ${results.length} checks passed`}
                </strong>
                {firstGreenRun && (
                  <p className="first-green">
                    <StatusChip tone="success">First all-green run this session</StatusChip>
                  </p>
                )}
              </div>
              {allPassed && !completed && !explaining && (
                <Button variant="primary" className="checks-next" onClick={onExplain}>
                  Explain your solution
                  <Icon name="arrow" />
                </Button>
              )}
            </div>
            <Suspense fallback={null}>
              <CheckFeedback results={results} open={openName} onOpen={chooseCase} verdict={verdict} />
            </Suspense>
            {typeIssues !== null && <TypeCheckNote issues={typeIssues} />}
            {!allPassed && lesson && (
              <p className="mistake-help">
                <Icon name="book" />
                <span>Stuck? Review</span>
                <Button variant="text" onClick={() => openLesson(lesson.id)}>
                  {lesson.title}
                  <Icon name="arrow" />
                </Button>
              </p>
            )}
          </>
        ) : stale ? (
          <div className="stale-results">
            <p className="stale-note">
              Your code changed since this run. The results stay here for reference; run again to check your edit.
            </p>
            <p className="call-intro">
              Optional: call each check for your next run. Afterwards, any surprises come first.{' '}
              {!noCalls(calls) && (
                <Button variant="text" onClick={() => setCalls({ checks: {} })}>
                  Clear calls
                </Button>
              )}
            </p>
            <Suspense fallback={null}>
              <CheckFeedback
                results={stale}
                stale
                open={openName}
                onOpen={chooseCase}
                calls={calls.checks}
                onCall={(name: string, call: Call | undefined) => {
                  const { [name]: _, ...rest } = calls.checks
                  setCalls({ ...calls, checks: call ? { ...rest, [name]: call } : rest })
                }}
              />
            </Suspense>
          </div>
        ) : (
          <div className="empty-results">
            <span className="empty-icon">
              <Icon name="code" />
            </span>
            <div>
              <strong>{runNotice ? 'Run checks again when ready' : 'Ready when you are'}</strong>
              <p>{runNotice || 'Run checks to see how your solution handles the examples and edge cases.'}</p>
              <div className="call-overall" role="group" aria-label="Your call: will every check pass?">
                <span>Your call, if you like: will every check pass?</span>
                {(['all', 'some'] as const).map(choice => (
                  <button
                    key={choice}
                    type="button"
                    aria-pressed={calls.overall === choice}
                    onClick={() => setCalls({ ...calls, overall: calls.overall === choice ? undefined : choice })}
                  >
                    {choice === 'all' ? 'Yes, all of them' : 'No, some will fail'}
                  </button>
                ))}
              </div>
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
  const { results, staleResults, runError, running, loadingEngine } = run
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
            ? loadingEngine
              ? 'Loading SQLite…'
              : 'Running checks…'
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
          // Both branches stay a plain button, so React keeps the same element and keyboard focus when Run turns into Stop.
          <button type="button" className="primary-button" disabled={!canRun} onClick={onRun}>
            <Icon name="play" />
            Run checks
          </button>
        )}
      </div>
    </div>
  )
}

/** Editor type errors, shown beside the check results but never counted as a check. */
function TypeCheckNote({ issues }: { issues?: TypeIssue[] }) {
  const shown = issues?.slice(0, 5) ?? []
  return (
    <div className={`type-check ${issues?.length ? 'type-check-errors' : ''}`}>
      <p>
        <Icon name={issues && !issues.length ? 'check' : 'alert'} /> {typeCheckSummary(issues)}
      </p>
      {shown.length > 0 && (
        <ul>
          {shown.map(issue => (
            <li key={`${issue.file}:${issue.line}:${issue.message}`}>
              <code>
                {issue.file}:{issue.line}
              </code>{' '}
              {issue.message}
            </li>
          ))}
          {issues!.length > shown.length && <li>…and {issues!.length - shown.length} more; hover the red underlines in the editor.</li>}
        </ul>
      )}
      <p className="type-check-note">Separate from the checks above. It does not prove the types the brief asks for.</p>
    </div>
  )
}
