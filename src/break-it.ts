// The Break it format's saved tries and input rules, shared by the practice worker (src/run-rep.ts) and the hunt's
// lazy desk (src/BreakIt.tsx). The tries are the attempt's code text, so the attempt shape, storage keys, and backups
// stay as they are; this module owns that text's shape.
import type { BreakTask } from './rep-types.ts'

/** One try as saved: the input, what the suspect and the contract returned (as shown), and the bugs it caught. */
export type BreakTry = { input: number[]; suspect: string; contract: string; caught: string[] }

/** A hunt keeps at most this many tries; the worker refuses a longer table. */
export const maxTries = 100
const maxShown = 200

const isTry = (value: unknown): value is BreakTry => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  return (
    Array.isArray(item.input) &&
    item.input.length <= 16 &&
    item.input.every(number => Number.isSafeInteger(number)) &&
    typeof item.suspect === 'string' &&
    item.suspect.length <= maxShown &&
    typeof item.contract === 'string' &&
    item.contract.length <= maxShown &&
    Array.isArray(item.caught) &&
    item.caught.length <= 16 &&
    item.caught.every(id => typeof id === 'string' && id.length <= 80)
  )
}

/** A table of tries read from a worker reply or saved text, or null when any part of it is not a try. */
export function readTriesValue(value: unknown): BreakTry[] | null {
  if (!Array.isArray(value) || value.length > maxTries || !value.every(isTry)) return null
  return value.map(({ input, suspect, contract, caught }) => ({ input: [...input], suspect, contract, caught: [...caught] }))
}

/** The saved tries, oldest first, or null when the saved text cannot be read (it is then kept as it is). */
export function readTries(code: string | undefined): BreakTry[] | null {
  if (code === undefined) return []
  try {
    return readTriesValue(JSON.parse(code))
  } catch {
    return null
  }
}

/** The tries as code text: valid JSON with one try per line, so the Journal and comparisons stay readable. */
export function formatTries(tries: readonly BreakTry[]): string {
  return tries.length ? `[\n${tries.map(item => `  ${JSON.stringify(item)}`).join(',\n')}\n]` : '[]'
}

/** A value as the log shows it, capped so a large answer cannot flood the saved text. */
export function showValue(value: unknown): string {
  let text: string
  try {
    text = JSON.stringify(value) ?? String(value)
  } catch {
    text = String(value)
  }
  return text.length > maxShown ? `${text.slice(0, maxShown - 1)}…` : text
}

/** "items 10, perPage 5": an input named by the suspect's parameters. */
export const describeInput = (task: BreakTask, input: readonly number[]) =>
  task.params.map((param, index) => `${param.name} ${input[index]}`).join(', ')

/** Whether a saved input follows every input rule, so a catch can only mean a real bug. */
export const followsRules = (task: BreakTask, input: readonly unknown[]) =>
  input.length === task.params.length &&
  task.params.every((param, index) => {
    const value = input[index]
    return Number.isSafeInteger(value) && (value as number) >= param.min && (value as number) <= param.max
  })

export type InputReading = { input: number[] } | { field: number; reason: string }

/**
 * Reads the learner's field text into an input. Only whole numbers written as digits are read; anything else, or a
 * value outside a parameter's range, is refused with the contract rule it breaks.
 */
export function readInput(task: BreakTask, texts: readonly string[]): InputReading {
  const input: number[] = []
  for (const [index, param] of task.params.entries()) {
    const text = (texts[index] ?? '').trim()
    if (!text) return { field: index, reason: `Enter a value for ${param.name}.` }
    const value = /^[+-]?\d+$/.test(text) ? Number(text) : NaN
    if (!Number.isSafeInteger(value) || value < param.min) return { field: index, reason: param.rule }
    if (value > param.max) return { field: index, reason: `This hunt takes ${param.name} up to ${param.max.toLocaleString('en-US')}.` }
    input.push(value)
  }
  return { input }
}

/** The distinct authored bugs the saved tries have caught, in authored order. */
export const caughtBugs = (task: BreakTask, tries: readonly BreakTry[]) =>
  task.bugs.filter(bug => tries.some(item => item.caught.includes(bug.id))).map(bug => bug.id)
