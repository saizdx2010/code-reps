import { repDepth } from './rep-depth.ts'
import type { RepTrace, TraceTreeNode } from './rep-depth.ts'
import { lessonDepth } from './lesson-depth.ts'

// Structural checks enforce coverage; editorial review must establish teaching quality.
export function validateContentDepth(repIds: Set<string>, skillIds: Set<string>, reviews = repDepth, lessons = lessonDepth) {
  const errors: string[] = []
  function check(ids: Set<string>, entries: Record<string, object>, fields: string[], label: string) {
    for (const id of ids) {
      const entry = entries[id] as Record<string, unknown> | undefined
      for (const field of fields) {
        if (typeof entry?.[field] !== 'string' || !entry[field].trim()) errors.push(`${id}: missing ${label} ${field}`)
      }
    }
    for (const id of Object.keys(entries)) if (!ids.has(id)) errors.push(`${id}: unknown ${label} target`)
  }
  check(repIds, reviews, ['reasoning', 'trace', 'alternative', 'counterexample', 'transfer'], 'rep review')
  for (const [id, review] of Object.entries(reviews)) {
    if (review.traceSteps) validateTrace(id, review.traceSteps, errors)
    const alternative = review.alternativeTrace
    if (alternative) {
      if (typeof alternative.title !== 'string' || !alternative.title.trim()) errors.push(`${id}: alternative trace needs a title`)
      validateTrace(`${id} (alternative)`, alternative.trace, errors)
    }
  }
  check(skillIds, lessons, ['title', 'code', 'reasoning', 'challenge', 'answer'], 'lesson depth')
  return errors
}

function validateTrace(id: string, trace: RepTrace, errors: string[]) {
  if (
    !Array.isArray(trace.code) ||
    !trace.code.length ||
    trace.code.some(line => typeof line !== 'string') ||
    !trace.code.some(line => typeof line === 'string' && line.trim())
  )
    errors.push(`${id}: trace code must be non-empty`)
  if (!Array.isArray(trace.steps) || trace.steps.length < 2) errors.push(`${id}: trace needs at least two steps`)
  for (const [index, step] of (trace.steps ?? []).entries()) {
    if (!Number.isInteger(step.line) || step.line < 0 || step.line >= (trace.code?.length ?? 0))
      errors.push(`${id}: trace step ${index} line is out of bounds`)
    if (typeof step.note !== 'string' || !step.note.trim()) errors.push(`${id}: trace step ${index} needs a note`)
    const structure = step.structure
    if (structure?.kind === 'tree') {
      const ids = new Set<string>()
      const walk = (node: TraceTreeNode) => {
        if (ids.has(node.id)) errors.push(`${id}: trace step ${index} tree has a duplicate node id`)
        ids.add(node.id)
        node.children?.forEach(walk)
      }
      walk(structure.root)
      for (const ref of [structure.current, ...(structure.visited ?? []), ...(structure.cached ?? [])])
        if (ref !== undefined && !ids.has(ref)) errors.push(`${id}: trace step ${index} tree references an unknown node`)
    }
    if (structure?.kind === 'calls') {
      if (!structure.frames.length) errors.push(`${id}: trace step ${index} call stack needs a frame`)
      if (structure.frames.slice(0, -1).some(frame => frame.returns !== undefined))
        errors.push(`${id}: trace step ${index} only the top frame may return`)
      if (structure.event === 'return' && structure.frames.at(-1)?.returns === undefined)
        errors.push(`${id}: trace step ${index} returning frame needs a return value`)
    }
    if (
      structure?.kind === 'state' &&
      structure.events &&
      structure.eventIndex !== undefined &&
      !(Number.isInteger(structure.eventIndex) && structure.eventIndex >= 0 && structure.eventIndex < structure.events.length)
    )
      errors.push(`${id}: trace step ${index} event index is out of bounds`)
    if (structure?.kind === 'table') {
      const width = structure.cells[0]?.length ?? 0
      if (!width || structure.cells.some(row => row.length !== width))
        errors.push(`${id}: trace step ${index} table needs equal, non-empty rows`)
      if (structure.colLabels && structure.colLabels.length !== width)
        errors.push(`${id}: trace step ${index} table column labels must match the columns`)
      if (structure.rowLabels && structure.rowLabels.length !== structure.cells.length)
        errors.push(`${id}: trace step ${index} table row labels must match the rows`)
      const inside = (cell: [number, number]) =>
        Number.isInteger(cell[0]) &&
        Number.isInteger(cell[1]) &&
        cell[0] >= 0 &&
        cell[0] < structure.cells.length &&
        cell[1] >= 0 &&
        cell[1] < width
      const refs = [...(structure.current ? [structure.current] : []), ...(structure.reads ?? [])]
      if (refs.some(cell => !inside(cell))) errors.push(`${id}: trace step ${index} table cell is out of bounds`)
      else {
        if (structure.current && structure.reads?.some(cell => cell[0] === structure.current![0] && cell[1] === structure.current![1]))
          errors.push(`${id}: trace step ${index} table cell cannot read itself`)
        if (structure.reads?.some(cell => structure.cells[cell[0]][cell[1]] === null))
          errors.push(`${id}: trace step ${index} table reads an unfilled cell`)
      }
    }
    if (step.structure?.kind === 'array') {
      const size = step.structure.values.length
      for (const pointer of Object.values(step.structure.pointers ?? {})) {
        if (!Number.isInteger(pointer) || pointer < 0 || pointer >= size) errors.push(`${id}: trace step ${index} pointer is out of bounds`)
      }
      const window = step.structure.window
      if (
        window &&
        !(Number.isInteger(window[0]) && Number.isInteger(window[1]) && window[0] >= 0 && window[0] <= window[1] && window[1] < size)
      )
        errors.push(`${id}: trace step ${index} window is out of bounds`)
    }
    if (structure?.kind === 'list') {
      const nodes = structure.rows.flatMap(row => row.nodes)
      const ids = new Set(nodes.map(node => node.id))
      if (ids.size !== nodes.length) errors.push(`${id}: trace step ${index} list has a duplicate node id`)
      if (nodes.some(node => node.next !== null && !ids.has(node.next)))
        errors.push(`${id}: trace step ${index} list links to an unknown node`)
      if (Object.values(structure.pointers ?? {}).some(target => target !== null && !ids.has(target)))
        errors.push(`${id}: trace step ${index} list pointer names an unknown node`)
    }
    if (structure?.kind === 'graph') {
      const ids = new Set(structure.nodes.map(node => node.id))
      const places = new Set(structure.nodes.map(node => node.at.join(',')))
      if (ids.size !== structure.nodes.length) errors.push(`${id}: trace step ${index} graph has a duplicate node id`)
      if (places.size !== structure.nodes.length) errors.push(`${id}: trace step ${index} graph places two nodes at one point`)
      if (structure.nodes.some(node => !node.at.every(value => Number.isInteger(value) && value >= 0)))
        errors.push(`${id}: trace step ${index} graph node position must be whole and non-negative`)
      const refs = [
        ...structure.edges.flat(),
        ...(structure.highlight ?? []).flat(),
        ...(structure.current ? [structure.current] : []),
        ...(structure.visited ?? []),
        ...(structure.queued ?? []),
      ]
      if (refs.some(ref => !ids.has(ref))) errors.push(`${id}: trace step ${index} graph references an unknown node`)
      const edge = ([from, to]: [string, string]) =>
        structure.edges.some(([a, b]) => (a === from && b === to) || (!structure.directed && a === to && b === from))
      if (structure.highlight?.some(pair => !edge(pair))) errors.push(`${id}: trace step ${index} graph highlights a missing edge`)
    }
  }
}
