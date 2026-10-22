import { journeys } from './learning.ts'
import type { PortableRecord } from './portability.ts'

// Post-completion comparisons. Both are shown only after the learner has finished their own work, so neither can act as a
// clue: an earlier attempt's writing, and an authored reference approach.

type Earlier = { record: PortableRecord; relation: 'same' | 'related'; journeyTitle?: string; days: number }

const DAY = 24 * 60 * 60 * 1000
// The first attempt shows the most growth, so Then and now reaches back to it rather than to last time.
const firstBefore = (history: PortableRecord[], repId: string, before: number) =>
  history
    .filter(record => {
      const time = Date.parse(record.completedAt)
      return record.repId === repId && Number.isFinite(time) && time < before
    })
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))[0]

/**
 * Then and now after finishing `repId` at `completedAt`: the first earlier attempt at the same rep, then, for a journey's
 * independent or recall rep, the first earlier attempt at the step before it. Empty when nothing qualifies.
 */
export function earlierWork(repId: string, completedAt: string, history: PortableRecord[]): Earlier[] {
  const finished = Date.parse(completedAt)
  if (!Number.isFinite(finished)) return []
  const found: Earlier[] = []
  const days = (record: PortableRecord) => Math.floor((finished - Date.parse(record.completedAt)) / DAY)
  const same = firstBefore(history, repId, finished)
  if (same) found.push({ record: same, relation: 'same', days: days(same) })
  for (const journey of journeys) {
    const previousStep = journey.recall === repId ? journey.independent : journey.independent === repId ? journey.guided : undefined
    const related = previousStep && firstBefore(history, previousStep, finished)
    if (related) found.push({ record: related, relation: 'related', journeyTitle: journey.title, days: days(related) })
  }
  return found
}

export type DiffLine = { text: string; side: 'both' | 'yours' | 'reference' }

// Indentation, spacing, and trailing semicolons do not change what a line does.
const normalize = (line: string) =>
  line
    .trim()
    .replace(/;$/, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([(){}[\],:;=<>+\-*/!?&|])\s*/g, '$1')

/**
 * A line comparison by longest common subsequence over normalized lines. Blank lines and comments are left out, so the
 * result shows structural differences rather than formatting. Lines appear in order: shared, then yours, then reference.
 */
export function lineDiff(yours: string, reference: string): DiffLine[] {
  return align(yours, reference).map(({ text, side }) => ({ text, side }))
}

// Shared lines keep both texts: `text` from yours, `other` from the reference.
function align(yours: string, reference: string): (DiffLine & { other?: string })[] {
  const lines = (source: string) =>
    source
      .split('\n')
      .map(line => line.replace(/\s+$/, ''))
      .filter(line => line.trim() && !/^\s*\/\//.test(line))
  const a = lines(yours)
  const b = lines(reference)
  const keyA = a.map(normalize)
  const keyB = b.map(normalize)
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      table[i][j] = keyA[i] === keyB[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
  const result: (DiffLine & { other?: string })[] = []
  let i = 0,
    j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && keyA[i] === keyB[j]) {
      result.push({ text: a[i], side: 'both', other: b[j] })
      i++
      j++
    } else if (j >= b.length || (i < a.length && table[i + 1][j] >= table[i][j + 1])) result.push({ text: a[i++], side: 'yours' })
    else result.push({ text: b[j++], side: 'reference' })
  }
  return result
}

/** How much of the reference's structure the learner's code shares, as shared reference lines out of all reference lines. */
export function sharedShare(diff: DiffLine[]) {
  const reference = diff.filter(line => line.side !== 'yours').length
  const shared = diff.filter(line => line.side === 'both').length
  return { shared, reference }
}

export type SideLine = { text: string; changed: boolean }

/**
 * Two versions of the same rep side by side: each keeps its own lines in order, and a line marked changed exists in
 * only one version (ignoring spacing, semicolons, comments, and blank lines, as in lineDiff).
 */
export function sideBySide(then: string, now: string): { then: SideLine[]; now: SideLine[] } {
  const diff = align(now, then)
  return {
    then: diff.filter(line => line.side !== 'yours').map(line => ({ text: line.other ?? line.text, changed: line.side === 'reference' })),
    now: diff.filter(line => line.side !== 'reference').map(line => ({ text: line.text, changed: line.side === 'yours' })),
  }
}
