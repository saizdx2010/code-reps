import { lazy, Suspense, useState } from 'react'
import type { CSSProperties } from 'react'
import { surprisesFirst, verdictSentence } from './check-calls.ts'
import type { Call, CallVerdict } from './check-calls.ts'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import type { TestResult } from './runner.types'

// The result rows of the checks drawer, loaded with the first run (src/ChecksDrawer.tsx prefetches it when a run starts).

// SQLite query plans load with the first SQL check that has one; without them, the plan shows as text.
const SqlPlan = lazy(() =>
  import('./SqlResults')
    .then(module => ({ default: module.SqlPlan }))
    .catch(() => ({ default: ({ lines }: { lines: string[] }) => <pre>{lines.join('\n')}</pre> })),
)
// A failed check's details load with the first failure; the check's name stays readable while they arrive.
const FailedCheck = lazy(() =>
  import('./FailedCheck')
    .then(module => ({ default: module.FailedCheck }))
    .catch(() => ({
      default: ({ result }: { result: TestResult; stale: boolean }) => (
        <>
          <summary>{result.name}</summary>
          {result.message && <p>{result.message}</p>}
        </>
      ),
    })),
)

/** Failed checks first, one diagnostic open at a time, then the passed checks. Stale results are a dimmed reference. */
export function CheckFeedback({
  results,
  stale = false,
  open,
  onOpen,
  verdict,
  calls,
  onCall,
}: {
  results: TestResult[]
  stale?: boolean
  /** How this run compares with the learner's calls: surprises sort first and each called row says how it went. */
  verdict?: CallVerdict | null
  /** Calls for the next run, made beside each check name in an out-of-date list. */
  calls?: Record<string, Call>
  onCall?: (name: string, call: Call | undefined) => void
  /** The failed check shown open. Owned by the caller so it survives a run going out of date. */
  open?: string | null
  onOpen?: (name: string | null) => void
}) {
  const failed = surprisesFirst(
    results.filter(result => !result.passed),
    verdict ?? null,
  )
  const passed = surprisesFirst(
    results.filter(result => result.passed),
    verdict ?? null,
  )
  const [ownOpen, setOwnOpen] = useState<string | null>(() => failed[0]?.name ?? null)
  const activeFailed = open === undefined ? ownOpen : open
  const setActiveFailed = (next: (current: string | null) => string | null) => {
    const value = next(activeFailed)
    setOwnOpen(value)
    onOpen?.(value)
  }
  // One running place across both lists, so the cascade reads failed rows first, then passed ones.
  const row = (result: TestResult, place: number) => (
    <li key={result.name} style={{ '--row': place } as CSSProperties}>
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
            <Suspense fallback={<summary>{result.name}</summary>}>
              <FailedCheck result={result} stale={stale} />
            </Suspense>
          </details>
        )}
      </div>
      {verdict?.byName[result.name] && (
        <StatusChip tone={verdict.byName[result.name] === 'surprise' ? 'attention' : 'neutral'}>
          {verdict.byName[result.name] === 'surprise' ? `Surprise · you said ${result.passed ? 'fail' : 'pass'}` : 'Called it'}
        </StatusChip>
      )}
      {result.passed && !onCall && <span className="check-outcome">{stale ? 'Passed last run' : 'Passed'}</span>}
      {onCall && (
        <span className="check-call" role="group" aria-label={`Your call for “${result.name}” next run`}>
          {(['pass', 'fail'] as const).map(call => (
            <button
              key={call}
              type="button"
              aria-pressed={calls?.[result.name] === call}
              onClick={() => onCall(result.name, calls?.[result.name] === call ? undefined : call)}
            >
              {call === 'pass' ? 'Pass' : 'Fail'}
            </button>
          ))}
        </span>
      )}
    </li>
  )
  return (
    <>
      {verdict && <p className="call-verdict">{verdictSentence(verdict, results)}</p>}
      {!!failed.length && <ul className={`result-list${stale ? ' is-stale' : ''}`}>{failed.map((result, index) => row(result, index))}</ul>}
      {!!passed.length && (
        <ul
          className={`result-list passed-checks${stale ? ' is-stale' : ''}`}
          aria-label={stale ? 'Passed in the last run' : 'Passed checks'}
        >
          {passed.map((result, index) => row(result, failed.length + index))}
        </ul>
      )}
    </>
  )
}
