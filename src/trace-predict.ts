import type { TraceStep } from './rep-depth.ts'

type Value = TraceStep['vars'][string]

/** Variables whose value differs from the previous step, including newly introduced ones. The first step has no prediction. */
export function changedVariables(step: TraceStep, previous?: TraceStep): string[] {
  if (!previous) return []
  return Object.entries(step.vars)
    .filter(([name, value]) => !Object.hasOwn(previous.vars, name) || previous.vars[name] !== value)
    .map(([name]) => name)
}

// Spacing, quote style, and letter case are not part of what a learner predicts about a value.
const normalize = (text: string) => text.trim().toLowerCase().replace(/["'`]/g, '').replace(/\s+/g, '')

/** Compares a typed prediction with an authored snapshot value, leniently about spacing, quotes, and case. */
export function predictionMatches(guess: string, value: Value): boolean {
  if (!guess.trim()) return false
  return normalize(guess) === normalize(String(value))
}

/** Tallies the revealed steps that had something to predict. Steps without a changed variable are not counted. */
export function predictionScore(
  steps: TraceStep[],
  revealed: ReadonlySet<number>,
  guesses: Readonly<Record<number, Record<string, string>>>,
) {
  let matched = 0,
    total = 0
  for (const index of revealed) {
    const names = changedVariables(steps[index], steps[index - 1])
    for (const name of names) {
      total++
      if (predictionMatches(guesses[index]?.[name] ?? '', steps[index].vars[name])) matched++
    }
  }
  return { matched, total }
}
