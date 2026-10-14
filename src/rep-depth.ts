import { reviews } from './review-registry.ts'

export type TraceStructure =
  | {
      kind: 'array'
      values: (string | number)[]
      pointers?: Record<string, number>
      dimmed?: number[]
      /** Inclusive [from, to] indices drawn as a labelled bracket, such as a sliding window or a search range. */
      window?: [number, number]
      windowLabel?: string
    }
  | { kind: 'stack'; values: (string | number)[] }
  | { kind: 'map'; entries: [string, string | number][] }
  | { kind: 'tree'; root: TraceTreeNode; current?: string; visited?: string[]; cached?: string[] }
  | { kind: 'list'; rows: TraceListRow[]; pointers?: Record<string, string | null> }
  | {
      kind: 'graph'
      nodes: TraceGraphNode[]
      edges: [string, string][]
      directed?: boolean
      current?: string
      visited?: string[]
      queued?: string[]
      /** Edges drawn heavier, such as the edge being followed or a found path. */
      highlight?: [string, string][]
    }
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
// Tree `cached` marks calls answered from a memo instead of being expanded again.
// List nodes sit left to right in authored order; `next` names any node id (in any row) or null, so rewired links draw as arcs.
export type TraceListNode = { id: string; value: string | number; next: string | null }
export type TraceListRow = { label?: string; nodes: TraceListNode[] }
// Graph nodes are placed on an authored grid: `at` is [column, row], so the same graph keeps its shape between steps.
export type TraceGraphNode = { id: string; label?: string | number; at: [number, number]; note?: string }
// Frames run bottom to top; only the top frame may carry a return value.
export type TraceFrame = { call: string; locals?: string; returns?: string | number | boolean }
export type TraceStep = { line: number; vars: Record<string, string | number | boolean | null>; structure?: TraceStructure; note: string }
export type RepTrace = { code: string[]; input: string; steps: TraceStep[] }

export type RepDepth = {
  reasoning: string
  trace: string
  traceSteps?: RepTrace
  alternative: string
  /** A second traced approach shown under "Compare approaches", such as a memoized recursion beside a table. */
  alternativeTrace?: { title: string; trace: RepTrace }
  counterexample: string
  transfer: string
}

// Authored post-attempt reviews. Keep these out of independent task prompts.
export const repDepth: Record<string, RepDepth> = Object.assign({}, ...reviews.map(review => review.depth))
