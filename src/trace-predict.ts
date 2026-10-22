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

/**
 * A step whose drawing has a single answer to "what changes next?" that a tap can check: the table cell being filled,
 * or the tree's current node. Only offered when the previous step drew the same structure and the answer moved.
 */
export type PickTarget = { kind: 'cell' | 'node'; answer: string }
type TreeNode = { id: string; children?: TreeNode[] }
const hasNode = (node: TreeNode, id: string): boolean => node.id === id || (node.children ?? []).some(child => hasNode(child, id))

export function pickTarget(step: TraceStep, previous?: TraceStep): PickTarget | null {
  const now = step.structure
  const before = previous?.structure
  if (now?.kind === 'table' && before?.kind === 'table' && now.current) {
    const sameShape = now.cells.length === before.cells.length && now.cells.every((row, r) => row.length === before.cells[r].length)
    const answer = now.current.join(',')
    return sameShape && before.current?.join(',') !== answer ? { kind: 'cell', answer } : null
  }
  if (now?.kind === 'tree' && before?.kind === 'tree' && now.current && now.current !== before.current && hasNode(before.root, now.current))
    return { kind: 'node', answer: now.current }
  return null
}

/** Tallies the revealed steps where the learner tapped a pick. Steps without a pick are not counted. */
export function pickScore(steps: TraceStep[], revealed: ReadonlySet<number>, picks: Readonly<Record<number, string>>) {
  let matched = 0,
    total = 0
  for (const index of revealed) {
    const target = pickTarget(steps[index], steps[index - 1])
    if (!target || picks[index] === undefined) continue
    total++
    if (picks[index] === target.answer) matched++
  }
  return { matched, total }
}
