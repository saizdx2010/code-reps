import type { TestResult } from './runner.types'

// Predict, then run: optional calls the learner makes before running checks. They are practice, not evidence: kept in
// component state for the session, never saved, never shown on Progress, and never part of fluency.

export type Call = 'pass' | 'fail'
/** Before the first run only the overall call is offered, since check names are not shown until a run reveals them. */
export type Calls = { overall?: 'all' | 'some'; checks: Record<string, Call> }
export type CallVerdict = {
  overall?: { call: 'all' | 'some'; held: boolean }
  /** Per-check calls that matched a check in this run. */
  called: number
  held: number
  /** Check name → whether the call held. Checks without a call are absent. */
  byName: Record<string, 'held' | 'surprise'>
}

export const noCalls = (calls: Calls) => !calls.overall && !Object.keys(calls.checks).length

/** How the calls made before a run compare with its results; null when nothing was called. */
export function judgeCalls(calls: Calls, results: TestResult[]): CallVerdict | null {
  if (noCalls(calls) || !results.length) return null
  const allPassed = results.every(result => result.passed)
  const byName: CallVerdict['byName'] = {}
  for (const result of results) {
    const call = calls.checks[result.name]
    if (call) byName[result.name] = (call === 'pass') === result.passed ? 'held' : 'surprise'
  }
  const outcomes = Object.values(byName)
  return {
    overall: calls.overall && { call: calls.overall, held: (calls.overall === 'all') === allPassed },
    called: outcomes.length,
    held: outcomes.filter(outcome => outcome === 'held').length,
    byName,
  }
}

/** Surprises first within the list, keeping the original order otherwise: a surprise is where the model and the code disagree. */
export const surprisesFirst = (results: TestResult[], verdict: CallVerdict | null) =>
  verdict
    ? [...results].sort((a, b) => Number(verdict.byName[b.name] === 'surprise') - Number(verdict.byName[a.name] === 'surprise'))
    : results

/** One sentence about the calls, or null. It describes guesses, never understanding. */
export function verdictSentence(verdict: CallVerdict, results: TestResult[]): string | null {
  const failed = results.filter(result => !result.passed).length
  const parts: string[] = []
  if (verdict.overall) {
    const said = verdict.overall.call === 'all' ? 'You said every check would pass' : 'You said some checks would fail'
    parts.push(
      verdict.overall.held
        ? `${said}: called it.`
        : `${said}. Surprise: ${verdict.overall.call === 'all' ? `${failed} failed` : 'they all passed'}.`,
    )
  }
  if (verdict.called) {
    const surprises = verdict.called - verdict.held
    parts.push(
      `You called ${verdict.held} of ${verdict.called} correctly.${surprises ? ` ${surprises === 1 ? '1 surprise' : `${surprises} surprises`}: look at ${surprises === 1 ? 'it' : 'these'} first.` : ''}`,
    )
  }
  return parts.join(' ') || null
}
