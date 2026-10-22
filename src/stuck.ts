import { difficultyLabels, isDifficulty } from './attempt-labels.ts'
import type { Difficulty } from './attempt-labels.ts'
import { catalogTopic } from './catalog-labels.ts'
import { repSummaryById } from './rep-index.ts'
import { DAY_MS } from './dates.ts'

// Where learners got stuck, from the optional "What was hardest?" answer on completed attempts and saved drafts.
// It is self-reported and describes a moment of practice; it is not a skill measure and never changes evidence.

export type StuckKind = Exclude<Difficulty, 'none'>
type StuckDraft = { difficulty?: unknown; completedAt?: string }
type StuckSource = StuckDraft & { repId: string }
export type StuckPoint = { repId: string; kind: StuckKind; at?: string; inProgress: boolean }

export const stuckWindowDays = 30

/** What usually helps for each kind of stuck point. Lessons are linked per rep from its own guidance. */
export const stuckAdvice: Record<StuckKind, string> = {
  wording: 'Reread the brief with Quick vocabulary open, then restate the contract in your plan before coding.',
  prerequisite: 'Open the lesson linked before the rep, or try the nearer step it suggests, then come back.',
  approach: 'Work the example by hand first and write the steps in your plan; the lesson’s worked examples show the usual approach.',
  typescript: 'Write the types for the inputs and the result first, then fill in the body one line at a time.',
  'edge-cases': 'List the empty, single, and boundary inputs in your plan before coding, and trace one of them.',
  integration: 'Solve one rule at a time and run the checks after each, so you know which piece breaks.',
}

function stuckPoints(history: StuckSource[], drafts: Record<string, StuckDraft | undefined>): StuckPoint[] {
  const points: StuckPoint[] = []
  for (const record of history) {
    if (!isDifficulty(record.difficulty) || record.difficulty === 'none' || !repSummaryById.has(record.repId)) continue
    points.push({ repId: record.repId, kind: record.difficulty, at: record.completedAt, inProgress: false })
  }
  for (const [repId, draft] of Object.entries(drafts)) {
    // A completed draft is already in history; only unfinished work adds a point.
    if (!draft || draft.completedAt || !isDifficulty(draft.difficulty) || draft.difficulty === 'none' || !repSummaryById.has(repId))
      continue
    points.push({ repId, kind: draft.difficulty, inProgress: true })
  }
  return points
}

const time = (point: StuckPoint) => (point.at ? Date.parse(point.at) : Number.NaN)

/**
 * Groups stuck points by kind and by catalog topic. "Recent" means the last 30 days, and unfinished drafts always count
 * as recent. The focus is the topic with the most recent stuck points, ties broken by the newest point.
 */
export function summarizeStuckPoints(history: StuckSource[], drafts: Record<string, StuckDraft | undefined>, now: number) {
  const points = stuckPoints(history, drafts)
  const recent = (point: StuckPoint) => point.inProgress || (time(point) > now - stuckWindowDays * DAY_MS && time(point) <= now)
  const newestFirst = (a: StuckPoint, b: StuckPoint) =>
    Number(b.inProgress) - Number(a.inProgress) || (Number.isFinite(time(b)) ? time(b) : 0) - (Number.isFinite(time(a)) ? time(a) : 0)
  const kinds = (Object.keys(difficultyLabels) as Difficulty[])
    .filter((kind): kind is StuckKind => kind !== 'none')
    .map(kind => {
      const matching = points.filter(point => point.kind === kind).sort(newestFirst)
      return { kind, label: difficultyLabels[kind], total: matching.length, recent: matching.filter(recent).length, points: matching }
    })
    .filter(group => group.total)
    .sort((a, b) => b.recent - a.recent || b.total - a.total)
  const topics = new Map<string, StuckPoint[]>()
  for (const point of points) {
    const topic = catalogTopic(repSummaryById.get(point.repId)!)
    topics.set(topic, [...(topics.get(topic) ?? []), point])
  }
  const byTopic = [...topics]
    .map(([topic, list]) => {
      const sorted = [...list].sort(newestFirst)
      const counts = new Map<StuckKind, number>()
      for (const point of sorted.filter(recent)) counts.set(point.kind, (counts.get(point.kind) ?? 0) + 1)
      const mainKind = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0]
      return { topic, total: list.length, recent: sorted.filter(recent).length, mainKind, points: sorted }
    })
    .sort((a, b) => b.recent - a.recent || b.total - a.total || newestFirst(a.points[0], b.points[0]))
  const focus = byTopic.find(topic => topic.recent > 0)
  return { total: points.length, kinds, topics: byTopic, focus }
}
