import { difficultyLabels, isDifficulty } from './attempt-labels.ts'
import type { Difficulty } from './attempt-labels.ts'
import { DAY_MS } from './dates.ts'
import { mistakeTags, normalizeMistakes } from './mistakes.ts'
import type { PortableRecord } from './portability.ts'
import { repTitle } from './rep-index.ts'
import { formatDate } from './ui-copy.ts'

// A look back over the last seven days, built only from completed attempts. It summarizes self-reported answers and
// practice volume; it is not a measure of skill, and saving it writes an ordinary Notebook note.

export const retroQuestions = [
  'What went well this week?',
  'Where did you get stuck, and what helped?',
  'What will you practice next week?',
] as const

const top = <T extends string>(values: T[]) => {
  const counts = new Map<T, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1])[0]
}

export function weeklyRetro(history: PortableRecord[], now: number) {
  const start = now - 7 * DAY_MS
  const inRange = (record: PortableRecord, from: number, to: number) => {
    const time = Date.parse(record.completedAt)
    return Number.isFinite(time) && time > from && time <= to
  }
  const week = history.filter(record => inRange(record, start, now))
  const previous = history.filter(record => inRange(record, start - 7 * DAY_MS, start))
  const days = new Set(week.map(record => new Date(record.completedAt).toDateString()))
  const mistake = top(week.flatMap(record => normalizeMistakes(record.mistakes) ?? []))
  const stuck = top(
    week.map(record => record.difficulty).filter((value): value is Exclude<Difficulty, 'none'> => isDifficulty(value) && value !== 'none'),
  )
  return {
    from: new Date(start).toISOString(),
    attempts: week.length,
    previousAttempts: previous.length,
    reps: [...new Set(week.map(record => record.repId))],
    practiceDays: days.size,
    unhinted: week.filter(record => record.hintCount === 0).length,
    hints: week.reduce((sum, record) => sum + record.hintCount, 0),
    topMistake: mistake && { label: mistakeTags.find(tag => tag.id === mistake[0])!.label, count: mistake[1] },
    topStuck: stuck && { label: difficultyLabels[stuck[0]], count: stuck[1] },
  }
}

export type WeeklyRetro = ReturnType<typeof weeklyRetro>

/** The facts line saved with a retro note, so the note still makes sense when read later. */
export function retroFacts(retro: WeeklyRetro) {
  const parts = [
    `${retro.attempts} completed ${retro.attempts === 1 ? 'attempt' : 'attempts'} on ${retro.practiceDays} ${retro.practiceDays === 1 ? 'day' : 'days'}`,
    `${retro.unhinted} without hints`,
    ...(retro.topMistake ? [`most tagged mistake: ${retro.topMistake.label}`] : []),
    ...(retro.topStuck ? [`hardest most often: ${retro.topStuck.label}`] : []),
  ]
  const reps = retro.reps.length ? ` Reps: ${retro.reps.map(repTitle).join(', ')}.` : ''
  return `Week from ${formatDate(retro.from)}: ${parts.join('; ')}.${reps}`
}

/** Builds the Notebook note body from the answers, keeping each question with its answer. Blank answers are left out. */
export function retroNoteBody(retro: WeeklyRetro, answers: readonly string[]) {
  const written = retroQuestions
    .map((question, index) => [question, answers[index]?.trim() ?? ''] as const)
    .filter(([, answer]) => answer)
    .map(([question, answer]) => `${question}\n${answer}`)
  return [retroFacts(retro), ...written].join('\n\n')
}
