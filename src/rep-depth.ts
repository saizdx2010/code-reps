import { reviews } from './review-registry.ts'

export type TraceStructure =
  | { kind: 'array'; values: (string | number)[]; pointers?: Record<string, number>; dimmed?: number[] }
  | { kind: 'stack'; values: (string | number)[] }
  | { kind: 'map'; entries: [string, string | number][] }
  | { kind: 'tree'; root: TraceTreeNode; current?: string; visited?: string[] }
  | { kind: 'calls'; frames: TraceFrame[]; event?: 'call' | 'return' }
  | {
      kind: 'table'
      cells: (string | number | null)[][]
      name?: string
      rowLabels?: string[]
      colLabels?: string[]
      current?: [number, number]
      reads?: [number, number][]
    }
  | { kind: 'state'; entries: [string, string | number | boolean | null][]; events?: string[]; eventIndex?: number }
// Table cells run row by row; null marks a cell that is not filled yet. Indices are [row, column].
export type TraceTreeNode = { id: string; value: string | number; note?: string; children?: TraceTreeNode[] }
// Frames run bottom to top; only the top frame may carry a return value.
export type TraceFrame = { call: string; locals?: string; returns?: string | number | boolean }
export type TraceStep = { line: number; vars: Record<string, string | number | boolean | null>; structure?: TraceStructure; note: string }
export type RepTrace = { code: string[]; input: string; steps: TraceStep[] }

export type RepDepth = {
  reasoning: string
  trace: string
  traceSteps?: RepTrace
  alternative: string
  counterexample: string
  transfer: string
}

// Authored post-attempt reviews. Keep these out of independent task prompts.
export const repDepth: Record<string, RepDepth> = Object.assign({}, ...reviews.map(review => review.depth))
