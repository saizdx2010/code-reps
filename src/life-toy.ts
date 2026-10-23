import type { PortableRecord } from './portability.ts'
import { latestCompletedCode } from './toy-rewards.ts'

// The Game of Life toy in Library → Projects runs the learner's own saved solutions to three ordinary reps. It runs them
// in the practice worker, never on the page, and compares each generation with the reference rules. It records nothing:
// the toy is play, not evidence.

export const lifeParts = [
  { id: 'life-count-neighbours', functionName: 'countNeighbours' },
  { id: 'life-next-cell', functionName: 'nextCell' },
  { id: 'life-next-generation', functionName: 'nextGeneration' },
] as const
export type LifePartName = (typeof lifeParts)[number]['functionName']
/** The learner's source for each part, from their latest completed attempt. */
export type LifeSources = Record<LifePartName, string>

/** Each part's latest completed code, or null for a part not completed yet. */
export function lifeSources(history: PortableRecord[]): Record<LifePartName, string | null> {
  return Object.fromEntries(lifeParts.map(part => [part.functionName, latestCompletedCode(history, part.id)])) as Record<
    LifePartName,
    string | null
  >
}

const live = (grid: string[], r: number, c: number) => grid[r]?.charAt(c) === '#'

/** The reference rules: eight neighbours, dead edges, survival on 2 or 3, birth on 3. */
export function referenceGeneration(grid: string[]): string[] {
  return grid.map((row, r) =>
    Array.from(row, (cell, c) => {
      let n = 0
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && live(grid, r + dr, c + dc)) n++
      return n === 3 || (cell === '#' && n === 2) ? '#' : '.'
    }).join(''),
  )
}

/** Cells where two boards of the same size differ, as [row, col]. */
export function differingCells(a: string[], b: string[]): [number, number][] {
  const cells: [number, number][] = []
  a.forEach((row, r) => Array.from(row, (cell, c) => cell !== b[r]?.charAt(c) && cells.push([r, c])))
  return cells
}

const isBoard = (value: unknown, like: string[]): value is string[] =>
  Array.isArray(value) &&
  value.length === like.length &&
  value.every((row, r) => typeof row === 'string' && row.length === like[r].length && /^[#.]*$/.test(row))

export type LifeStep = { grid: string[]; inspect?: [number, number] }
export type LifeResult =
  | {
      next: string[]
      /** Cells where the learner's next generation differs from the rules. */
      differs: [number, number][]
      /** What the learner's countNeighbours and nextCell say about one cell of the current board. */
      inspect?: { position: [number, number]; neighbours: unknown; next: unknown }
    }
  | { error: string }

/**
 * Builds a stepper from the learner's sources. `compile` turns one source into JavaScript that defines the named
 * function (src/compile-solution.ts in the worker). Each part runs in its own scope, so the parts' helpers never clash.
 */
export function lifeStepper(sources: LifeSources, compile: (source: string, functionName: string) => string) {
  const parts = Object.fromEntries(
    lifeParts.map(({ functionName }) => {
      const output = compile(sources[functionName], functionName)
      const fn: unknown = new Function(`${output}\nreturn typeof ${functionName} === 'function' ? ${functionName} : undefined`)()
      if (typeof fn !== 'function') throw new Error(`Your saved ${functionName} does not define a function named ${functionName}.`)
      return [functionName, fn]
    }),
  ) as Record<LifePartName, (...args: unknown[]) => unknown>
  return ({ grid, inspect }: LifeStep): LifeResult => {
    try {
      const next = parts.nextGeneration(structuredClone(grid))
      if (!isBoard(next, grid)) return { error: 'Your nextGeneration returned something other than a board of the same size.' }
      const result: LifeResult = { next, differs: differingCells(next, referenceGeneration(grid)) }
      if (inspect) {
        const neighbours = parts.countNeighbours(structuredClone(grid), [...inspect])
        const next = typeof neighbours === 'number' ? parts.nextCell(live(grid, inspect[0], inspect[1]), neighbours) : undefined
        result.inspect = { position: inspect, neighbours, next }
      }
      return result
    } catch (error) {
      return { error: `Your code threw an error: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
}

/** A still board, or one that repeats the board two steps back, has settled; play stops there. */
export const settled = (history: string[][]) => {
  const [current, previous, before] = [history.at(-1), history.at(-2), history.at(-3)]
  const same = (a?: string[], b?: string[]) => !!a && !!b && a.join('\n') === b.join('\n')
  return same(current, previous) || same(current, before)
}

/** A small starting board: a glider and a blinker on a 20 × 12 field. */
export const startingBoard = (): string[] =>
  Array.from({ length: 12 }, (_, r) =>
    Array.from({ length: 20 }, (_, c) =>
      (r === 1 && c === 2) || (r === 2 && c === 3) || (r === 3 && c >= 1 && c <= 3) || (r === 7 && c >= 13 && c <= 15) ? '#' : '.',
    ).join(''),
  )
