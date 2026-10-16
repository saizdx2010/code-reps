import type { Badge } from './badges.ts'
import { DAY_MS } from './dates.ts'
import { getAllJourneys } from './learning.ts'
import type { JourneyProgress } from './learning.ts'
import type { PortableRecord } from './portability.ts'
import { dayNumber } from './profile-progress.ts'
import { repTitle } from './rep-index.ts'
import { buildSkillMap } from './skill-map.ts'
import { formatDate } from './ui-copy.ts'
import { paths } from './path.ts'

/** A recall at least this long after independence earns "Held for a month". */
export const heldDays = 30
/** "Welcome back" needs at least this many days without practice before the day you return. */
export const breakDays = 14
/** "Four steady weeks": this many weeks in a row, each with at least `steadyDays` practice days. */
export const steadyWeeks = 4
export const steadyDays = 3

type Earned = { at: string; repId: string; detail: string }

function badge(
  id: string,
  name: string,
  rule: string,
  starter: string,
  earned: Earned | undefined,
  total = 1,
  completed = earned ? 1 : 0,
): Badge {
  return {
    id,
    kind: 'evidence',
    name,
    rule,
    earned: Boolean(earned),
    completed: Math.min(completed, total),
    total,
    earnedAt: earned?.at,
    repId: earned?.repId ?? starter,
    detail: earned?.detail,
  }
}

const time = (record: { completedAt: string }) => Date.parse(record.completedAt)
function earliest<T>(items: T[], at: (item: T) => number): T | undefined {
  return [...items].sort((a, b) => at(a) - at(b))[0]
}

/**
 * Badges for evidence of learning, never for volume: independence, retention, steady practice, and coming back.
 * Like completion badges they are worked out from completed attempts every time, so nothing is stored and backups
 * are unchanged. Invalid and future dates never count.
 */
export function evidenceBadges(history: PortableRecord[], now = new Date()): Badge[] {
  const records = history.filter(record => Number.isFinite(time(record)) && time(record) <= now.getTime())
  const journeys = getAllJourneys(records, now.getTime())
  const starter = journeys[0].journey.guided
  const independent = journeys.filter(state => state.independent)
  const retained = journeys
    .flatMap(state => (state.retained ? [{ state, record: state.retained }] : []))
    .sort((a, b) => time(a.record) - time(b.record))

  const firstIndependent = earliest(independent, state => time(state.independent!))
  const firstRetained = retained[0]
  const kept = (count: number): Earned | undefined => {
    const item = retained[count - 1]
    return (
      item && {
        at: item.record.completedAt,
        repId: item.record.repId,
        detail: `${count} different skills kept; the latest is ${item.state.journey.title}.`,
      }
    )
  }

  // A recall solved without hints at least a month after that skill became independent.
  const held = independent
    .flatMap(state =>
      records
        .filter(
          record =>
            record.repId === state.journey.recall && record.hintCount === 0 && time(record) - time(state.independent!) >= heldDays * DAY_MS,
        )
        .map(record => ({ state, record })),
    )
    .sort((a, b) => time(a.record) - time(b.record))[0]

  // Practice days, oldest first, each with the first attempt completed that day.
  const days = new Map<number, PortableRecord>()
  for (const record of [...records].sort((a, b) => time(a) - time(b))) {
    const day = dayNumber(new Date(record.completedAt))
    if (!days.has(day)) days.set(day, record)
  }
  const dayList = [...days.keys()]

  // Weeks run Monday to Sunday in local time; the badge is earned on the deciding practice day of the fourth week.
  const weekOf = (day: number) => day - ((new Date(day * DAY_MS).getUTCDay() + 6) % 7)
  const weeks = new Map<number, number[]>()
  for (const day of dayList) weeks.set(weekOf(day), [...(weeks.get(weekOf(day)) ?? []), day])
  let steady: Earned | undefined
  let run = 0
  for (const week of [...weeks.keys()].sort((a, b) => a - b)) {
    const practiced = weeks.get(week)!
    run = practiced.length >= steadyDays ? (weeks.has(week - 7) && run ? run + 1 : 1) : 0
    if (run >= steadyWeeks) {
      const record = days.get(practiced[steadyDays - 1])!
      steady = {
        at: record.completedAt,
        repId: record.repId,
        detail: `${steadyDays} or more practice days a week from ${formatDate((week - 7 * (steadyWeeks - 1)) * DAY_MS)} to ${formatDate(record.completedAt)}.`,
      }
      break
    }
  }

  // The first practice day after a break of at least two weeks.
  const back = dayList.find((day, index) => index > 0 && day - dayList[index - 1] - 1 >= breakDays)
  const returned = back === undefined ? undefined : days.get(back)!
  const breakLength = back === undefined ? 0 : back - dayList[dayList.indexOf(back) - 1] - 1

  // A whole stretch of trail done independently: every skill in one track stage at Independent or beyond.
  const stage = stageIndependently(journeys)

  const detail = (state: JourneyProgress, record: { repId: string }, how: string) =>
    `${state.journey.title}: ${repTitle(record.repId)} ${how}.`
  return [
    badge(
      'first-independent',
      'First independent skill',
      'Solve a related rep without hints after its guided rep.',
      starter,
      firstIndependent && {
        at: firstIndependent.independent!.completedAt,
        repId: firstIndependent.independent!.repId,
        detail: detail(firstIndependent, firstIndependent.independent!, 'solved without hints after the guided rep'),
      },
    ),
    badge(
      'first-retained',
      'First retained skill',
      'Solve a fresh recall rep without hints after the break.',
      starter,
      firstRetained && {
        at: firstRetained.record.completedAt,
        repId: firstRetained.record.repId,
        detail: detail(firstRetained.state, firstRetained.record, 'recalled without hints after the break'),
      },
    ),
    badge('five-kept', 'Five skills kept', 'Retain five different skills.', starter, kept(5), 5, retained.length),
    badge('ten-kept', 'Ten skills kept', 'Retain ten different skills.', starter, kept(10), 10, retained.length),
    badge(
      'held-month',
      'Held for a month',
      `Solve a recall rep without hints ${heldDays} or more days after that skill became independent.`,
      starter,
      held && {
        at: held.record.completedAt,
        repId: held.record.repId,
        detail: `${held.state.journey.title}: recalled ${Math.floor((time(held.record) - time(held.state.independent!)) / DAY_MS)} days after you became independent.`,
      },
    ),
    badge(
      'steady-weeks',
      'Four steady weeks',
      `Practice on at least ${steadyDays} days in each of ${steadyWeeks} weeks in a row. Reviews count.`,
      starter,
      steady,
    ),
    badge(
      'welcome-back',
      'Welcome back',
      `Practice again after a break of ${breakDays} days or more.`,
      starter,
      returned && {
        at: returned.completedAt,
        repId: returned.repId,
        detail: `Back after ${breakLength} days away. Breaks are part of learning.`,
      },
    ),
    badge('stage-independent', 'Stage, independently', 'Bring every skill in one track stage to Independent.', starter, stage),
  ]
}

function stageIndependently(journeys: JourneyProgress[]): Earned | undefined {
  const evidence = new Map(journeys.map(state => [state.journey.id, state]))
  const candidates = paths.flatMap(path =>
    buildSkillMap(path.id, journeys).stages.flatMap(stage => {
      if (!stage.nodes.every(node => node.state === 'independent' || node.state === 'due' || node.state === 'retained')) return []
      // Dated when the last of its skills became independent.
      const last = stage.nodes.map(node => evidence.get(node.id)!.independent!).sort((a, b) => time(b) - time(a))[0]
      return [{ at: last.completedAt, repId: last.repId, detail: `${stage.title} (${path.title}): every skill solved on your own.` }]
    }),
  )
  return earliest(candidates, item => Date.parse(item.at))
}
