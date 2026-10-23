import type { FluencyState, LearningNote } from './fluency.ts'
import type { PortableRecord } from './portability.ts'
import type { TrailStage } from './trail-map.ts'
import { formatDate, plural } from './ui-copy.ts'

// "Your first 4 weeks": a defined-length starter program derived from the goal track, the weekly plan, and saved attempts.
// It starts on the day of the first completed attempt (today until there is one), takes the goal trail's reps in order,
// a few a week, with each lesson the trail places before them, and ends with a reflection. Nothing is stored for it
// except that reflection, which is an ordinary Notebook note whose id starts with `reflectionPrefix`.
// It reads the goal trail Home already draws (src/trail-map.ts), so the two never disagree about order or done state.

export const programWeeks = 4
/** After the last week the finish state stays on Trail for one more week, unless the reflection is saved sooner. */
const finishShownWeeks = 1
export const reflectionPrefix = 'first-weeks-'
export const reflectionQuestions = [
  'What can you do now that you could not do four weeks ago?',
  'What helped you keep practicing, and what got in the way?',
  'What will you practice next?',
] as const

export type ProgramItem =
  | { kind: 'lesson'; id: string; title: string; done: boolean }
  | { kind: 'rep'; id: string; title: string; done: boolean; stage: number; role: string }
export type ProgramWeek = { number: number; startsAt: number; endsAt: number; items: ProgramItem[]; done: number }
export type StarterProgram = {
  /** Local midnight of the first day. */
  startAt: number
  /** False until a first attempt is completed; until then the program starts today. */
  started: boolean
  /** The current week, 1 to 4, or 5 once the program is finished. */
  week: number
  finished: boolean
  perWeek: number
  weeks: ProgramWeek[]
  done: number
  total: number
  reflection?: LearningNote
  /** Whether Trail shows the card: while running, then the finish state until the reflection or the week after. */
  onTrail: boolean
}

type Input = {
  history: PortableRecord[]
  goal: FluencyState['goal']
  /** The goal trail's stages, as Home draws them: returning learners' skipped stages are already left out, a rep is done
   * once completed, and a lesson once one of its predictions is checked. */
  stages: readonly TrailStage[]
  notes: readonly LearningNote[]
  now: number
}

/** New reps a week: one for each planned session of about 20 minutes, between two and six. Without days, three. */
export function repsPerWeek(goal: FluencyState['goal']) {
  const sessions = goal.days.length || 3
  return Math.min(6, Math.max(2, sessions * Math.max(1, Math.round(goal.minutes / 20))))
}

const midnight = (time: number) => {
  const date = new Date(time)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}
/** Local midnight `days` later, so a daylight-saving change never moves a week's start off its day. */
const addDays = (time: number, days: number) => {
  const date = new Date(time)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days).getTime()
}

export function starterProgram({ history, goal, stages, notes, now }: Input): StarterProgram {
  const times = history.map(record => Date.parse(record.completedAt)).filter(time => Number.isFinite(time) && time <= now)
  const startAt = midnight(times.length ? Math.min(...times) : now)
  const perWeek = repsPerWeek(goal)
  const weeks: ProgramWeek[] = Array.from({ length: programWeeks }, (_, index) => ({
    number: index + 1,
    startsAt: addDays(startAt, index * 7),
    endsAt: addDays(startAt, index * 7 + 6),
    items: [],
    done: 0,
  }))
  // Recall reps wait for a break after independent work, so they come back as reviews rather than as weekly targets.
  let placed = 0
  let lessons: ProgramItem[] = []
  for (const [index, stage] of stages.entries()) {
    for (const node of stage.nodes) {
      if (placed >= perWeek * programWeeks) break
      if (node.kind === 'lesson') lessons.push({ kind: 'lesson', id: node.skillId, title: node.title, done: node.state === 'done' })
      if (node.kind !== 'rep' || node.role === 'Recall') continue
      const week = weeks[Math.floor(placed++ / perWeek)]
      week.items.push(...lessons, {
        kind: 'rep',
        id: node.repId,
        title: node.title,
        done: node.state === 'done',
        stage: index + 1,
        role: node.role,
      })
      lessons = []
    }
  }
  for (const week of weeks) week.done = week.items.filter(item => item.done).length
  const day = Math.round((midnight(now) - startAt) / 86_400_000)
  const finished = day >= programWeeks * 7
  const reflection = notes.find(note => note.id.startsWith(reflectionPrefix))
  const items = weeks.flatMap(week => week.items)
  return {
    startAt,
    started: times.length > 0,
    week: Math.min(programWeeks + 1, Math.floor(day / 7) + 1),
    finished,
    perWeek,
    weeks,
    done: items.filter(item => item.done).length,
    total: items.length,
    ...(reflection ? { reflection } : {}),
    onTrail: !finished || (!reflection && day < (programWeeks + finishShownWeeks) * 7),
  }
}

/** The facts line saved with the reflection, so the note still makes sense when read later. */
export function programFacts(program: StarterProgram, history: PortableRecord[]) {
  const end = addDays(program.startAt, programWeeks * 7)
  const within = history.filter(record => {
    const time = Date.parse(record.completedAt)
    return time >= program.startAt && time < end
  })
  const days = new Set(within.map(record => new Date(record.completedAt).toDateString())).size
  const unhinted = within.filter(record => record.hintCount === 0).length
  return (
    `Your first 4 weeks, from ${formatDate(program.startAt)} to ${formatDate(addDays(end, -1))}: ` +
    `${program.done} of ${program.total} ${plural(program.total, 'target')} done; ` +
    `${within.length} completed ${plural(within.length, 'attempt')} on ${days} ${plural(days, 'day')}, ${unhinted} without hints.`
  )
}

/** The Notebook note body: the facts, then each answered question with its answer. Blank answers are left out. */
export function reflectionBody(program: StarterProgram, history: PortableRecord[], answers: readonly string[]) {
  const written = reflectionQuestions
    .map((question, index) => [question, answers[index]?.trim() ?? ''] as const)
    .filter(([, answer]) => answer)
    .map(([question, answer]) => `${question}\n${answer}`)
  return [programFacts(program, history), ...written].join('\n\n')
}
