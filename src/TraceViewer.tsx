import { useState } from 'react'
import { Button } from './Button'
import type { RepTrace, TraceStep, TraceStructure, TraceTreeNode } from './rep-depth'

const outline = (node: TraceTreeNode): string => `${node.value}${node.note ? ` (${node.note})` : ''}${node.children?.length ? ` with children ${node.children.map(outline).join(', ')}` : ''}`
const nodeValue = (root: TraceTreeNode, id?: string): string | undefined => {
  if (root.id === id) return String(root.value)
  for (const child of root.children ?? []) { const found = nodeValue(child, id); if (found !== undefined) return found }
}
const nodeValues = (root: TraceTreeNode, ids: string[] = []) => ids.map(id => nodeValue(root, id)).filter(Boolean).join(', ') || 'none'

type TableStructure = Extract<TraceStructure, { kind: 'table' }>
const tableName = (table: TableStructure, [row, col]: [number, number]) => {
  const column = table.colLabels?.[col] ?? col
  return `${table.name ?? 'cell'}[${table.cells.length > 1 ? `${table.rowLabels?.[row] ?? row}][${column}` : column}]`
}
const joinAnd = (items: string[]) => items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
const tableFocus = (table: TableStructure) => {
  const reads = table.reads ?? []
  if (!table.current) return reads.length ? `Reading ${joinAnd(reads.map(cell => tableName(table, cell)))}.` : 'No cell is being filled.'
  return `Filling ${tableName(table, table.current)}${reads.length ? `, which reads ${joinAnd(reads.map(cell => tableName(table, cell)))}` : ', which reads no other cell'}.`
}
const isCell = (cells: [number, number][] | undefined, row: number, col: number) => Boolean(cells?.some(cell => cell[0] === row && cell[1] === col))

function describe(structure: TraceStructure) {
  if (structure.kind === 'table') return `Table with ${structure.cells.length} ${structure.cells.length === 1 ? 'row' : 'rows'}: ${structure.cells.map((row, r) => `${structure.rowLabels ? `row ${structure.rowLabels[r]}: ` : ''}${row.map((value, c) => `${structure.colLabels?.[c] ?? c} = ${value ?? 'not filled yet'}`).join(', ')}`).join('; ')}. ${tableFocus(structure)}`
  if (structure.kind === 'map') return `Map entries: ${structure.entries.map(([key, value]) => `${key}: ${value}`).join(', ') || 'empty'}.`
  if (structure.kind === 'tree') return `Tree, root first: ${outline(structure.root)}. Current node: ${nodeValue(structure.root, structure.current) ?? 'none'}. Visited nodes: ${nodeValues(structure.root, structure.visited)}.`
  if (structure.kind === 'calls') {
    const frames = [...structure.frames].reverse().map((frame, index) => `${index === 0 ? 'top' : 'below'}: ${frame.call}${frame.locals ? `, ${frame.locals}` : ''}${frame.returns !== undefined ? `, returns ${frame.returns}` : ''}`).join('; ')
    const event = structure.event === 'call' ? ' The top frame was just pushed.' : structure.event === 'return' ? ' The top frame is returning and will be popped.' : ''
    return `Call stack, top first: ${frames}.${event}`
  }
  if (structure.kind === 'state') return `State: ${structure.entries.map(([label, value]) => `${label} = ${String(value)}`).join(', ')}.${structure.events ? ` Events: ${structure.events.map((event, index) => `${index === structure.eventIndex ? 'current ' : ''}${event}`).join(', ')}.` : ''}`
  const values = structure.values.map((value, index) => `${index}: ${value}`).join(', ') || 'empty'
  if (structure.kind === 'stack') return `Stack, bottom to top: ${values}.`
  return `Array: ${values}. Pointers: ${Object.entries(structure.pointers ?? {}).map(([name, index]) => `${name} at index ${index}`).join(', ') || 'none'}. Dimmed indices: ${structure.dimmed?.join(', ') || 'none'}.`
}

type Placed = { node: TraceTreeNode; x: number; y: number; parent?: Placed }
const TREE_GAP = 76, TREE_LEVEL = 88, TREE_RADIUS = 22

function layoutTree(root: TraceTreeNode) {
  const placed: Placed[] = []
  let slot = 0, depth = 0
  const place = (node: TraceTreeNode, level: number, parent?: Placed): Placed => {
    depth = Math.max(depth, level)
    const entry: Placed = { node, x: 0, y: level * TREE_LEVEL + TREE_RADIUS + 4, parent }
    placed.push(entry)
    const kids = (node.children ?? []).map(child => place(child, level + 1, entry))
    entry.x = kids.length ? (kids[0].x + kids[kids.length - 1].x) / 2 : TREE_GAP / 2 + slot++ * TREE_GAP
    return entry
  }
  place(root, 0)
  return { placed, width: Math.max(slot, 1) * TREE_GAP, height: depth * TREE_LEVEL + TREE_RADIUS * 2 + 36 }
}

function TreeView({ structure }: { structure: Extract<TraceStructure, { kind: 'tree' }> }) {
  const { placed, width, height } = layoutTree(structure.root)
  return <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    {placed.filter(entry => entry.parent).map(entry => <line key={`edge-${entry.node.id}`} className="trace-edge" x1={entry.parent!.x} y1={entry.parent!.y + TREE_RADIUS} x2={entry.x} y2={entry.y - TREE_RADIUS} />)}
    {placed.map(({ node, x, y }) => {
      const state = node.id === structure.current ? 'trace-node-current' : structure.visited?.includes(node.id) ? 'trace-dimmed' : undefined
      return <g key={node.id} className={state}>
        <circle cx={x} cy={y} r={TREE_RADIUS} />
        <text x={x} y={y + 5}>{node.value}</text>
        {node.note && <text className="trace-node-note" x={x} y={y + TREE_RADIUS + 16}>{node.note}</text>}
      </g>
    })}
  </svg>
}

function CallStack({ structure }: { structure: Extract<TraceStructure, { kind: 'calls' }> }) {
  const top = structure.frames.length - 1
  return <ol className="trace-calls" aria-hidden="true">
    {[...structure.frames].reverse().map((frame, row) => {
      const isTop = row === 0
      const returning = isTop && structure.event === 'return'
      return <li key={`${top - row}-${frame.call}`} className={`trace-frame${isTop ? ' trace-frame-top' : ''}${isTop && structure.event === 'call' ? ' trace-frame-new' : ''}`}>
        <code>{frame.call}</code>
        {frame.locals && <span className="trace-frame-locals">{frame.locals}</span>}
        {(isTop && structure.event === 'call') && <span className="trace-frame-tag">pushed</span>}
        {frame.returns !== undefined && <span className="trace-frame-tag">{returning ? 'returns' : 'returned'} <code>{String(frame.returns)}</code>{returning ? ', then popped' : ''}</span>}
      </li>
    })}
  </ol>
}

function StatePanel({ structure, previous }: { structure: Extract<TraceStructure, { kind: 'state' }>; previous?: TraceStep }) {
  const before = previous?.structure?.kind === 'state' ? new Map(previous.structure.entries) : undefined
  return <div className="trace-state" aria-hidden="true">
    {structure.events && <ol className="trace-events">{structure.events.map((event, index) => <li key={index} className={index === structure.eventIndex ? 'trace-event-current' : index < (structure.eventIndex ?? -1) ? 'trace-event-done' : undefined}><code>{event}</code></li>)}</ol>}
    <dl className="trace-state-rows">{structure.entries.map(([label, value]) => {
      const changed = Boolean(before) && (!before!.has(label) || before!.get(label) !== value)
      return <div key={label} className={changed ? 'trace-changed' : undefined}><dt>{label}</dt><dd><code>{String(value)}</code>{changed && <span className="trace-change-label"> changed</span>}</dd></div>
    })}</dl>
  </div>
}

function TableView({ structure }: { structure: TableStructure }) {
  const grid = structure.cells.length > 1
  const rows = structure.cells.map((row, r) => <div key={r} className="trace-table-row">
    {structure.rowLabels && <span className="trace-table-rowlabel">{structure.rowLabels[r]}</span>}
    {row.map((value, c) => {
      const now = structure.current?.[0] === r && structure.current[1] === c
      const read = isCell(structure.reads, r, c)
      const kind = now ? 'trace-cell-now' : read ? 'trace-cell-read' : value === null ? 'trace-cell-empty' : 'trace-cell-filled'
      return <div key={c} className={`trace-cell ${kind}`}>
        <span className="trace-cell-index">{structure.colLabels?.[c] ?? c}</span>
        <span className="trace-cell-value">{value ?? '–'}</span>
        <span className="trace-cell-tag">{now ? 'now' : read ? '↑ reads' : value === null ? 'empty' : ''}</span>
      </div>
    })}
  </div>)
  return <div className="trace-structure trace-table">
    {grid ? <div className="trace-table-scroll" role="group" aria-label="Table cells, scroll sideways if clipped" tabIndex={0}><div aria-hidden="true">{rows}</div></div> : <div className="trace-table-wrap" aria-hidden="true">{rows}</div>}
    <p className="trace-table-focus" aria-hidden="true">{tableFocus(structure)}</p>
    <p className="trace-legend" aria-hidden="true">Solid: filled. Dashed “empty”: not filled yet. Thick outline “now”: cell being filled. Double outline “↑ reads”: cells it uses.</p>
    <p className="sr-only">{describe(structure)}</p>
  </div>
}

function Structure({ structure, previous }: { structure: TraceStructure; previous?: TraceStep }) {
  if (structure.kind === 'table') return <TableView structure={structure} />
  if (structure.kind === 'tree') return <div className="trace-structure trace-tree"><TreeView structure={structure} /><p className="trace-legend" aria-hidden="true">Filled outline: current node. Dashed: visited.</p><p className="sr-only">{describe(structure)}</p></div>
  if (structure.kind === 'calls') return <div className="trace-structure"><CallStack structure={structure} /><p className="sr-only">{describe(structure)}</p></div>
  if (structure.kind === 'state') return <div className="trace-structure"><StatePanel structure={structure} previous={previous} /><p className="sr-only">{describe(structure)}</p></div>
  const cells = structure.kind === 'map' ? structure.entries.map(([key, value]) => `${key}: ${value}`) : structure.values.map(String)
  const vertical = structure.kind !== 'array'
  const pointers = structure.kind === 'array' ? Object.entries(structure.pointers ?? {}) : []
  const width = vertical ? 260 : Math.max(100, cells.length * 90)
  const height = vertical ? Math.max(60, cells.length * 54) : 100 + pointers.length * 28
  return <div className="trace-structure"><svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    {cells.map((value, index) => {
      const x = vertical ? 5 : index * 90 + 5
      const y = vertical ? (structure.kind === 'stack' ? cells.length - index - 1 : index) * 54 + 5 : 22
      const dimmed = structure.kind === 'array' && structure.dimmed?.includes(index)
      return <g key={index} className={dimmed ? 'trace-dimmed' : undefined}>
        <rect x={x} y={y} width={vertical ? 250 : 80} height={40} rx={8} />
        <text x={x + (vertical ? 125 : 40)} y={y + 25}>{value}</text>
        {!vertical && <text x={x + 40} y={14} className="trace-index">{index}</text>}
      </g>
    })}
    {pointers.map(([name, index], row) => <g key={name} className="trace-pointer" transform={`translate(${index * 90 + 45}, ${70 + row * 28})`}><path d="M 0 0 L -6 10 L 6 10 Z" /><text y={25}>{name}</text></g>)}
    {!cells.length && <text x={width / 2} y={30}>Empty {structure.kind}</text>}
  </svg><p className="sr-only">{describe(structure)}</p></div>
}

/** Authored snapshots for post-solve comparison, not a live code execution trace. */
export function TraceViewer({ trace }: { trace: RepTrace }) {
  const [index, setIndex] = useState(0)
  const step = trace.steps[index]
  const previous = trace.steps[index - 1]
  const move = (delta: number) => setIndex(current => Math.max(0, Math.min(trace.steps.length - 1, current + delta)))
  return <section className="trace-viewer" aria-label="Step trace" tabIndex={0} onKeyDown={event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if (event.target instanceof Element && event.target.closest('.trace-table-scroll')) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      event.stopPropagation()
      move(event.key === 'ArrowRight' ? 1 : -1)
    }
  }}>
    <h4>Step trace</h4><p className="utility-note">Authored reference snapshots</p><p><strong>Input:</strong> <code>{trace.input}</code></p>
    <div className="trace-panes"><div className="trace-code" role="list" aria-label="Trace code">
      {trace.code.map((line, lineIndex) => <div role="listitem" key={lineIndex} className={lineIndex === step.line ? 'trace-current' : undefined} aria-current={lineIndex === step.line ? 'step' : undefined}><span className="trace-line-number" aria-hidden="true">{lineIndex + 1}</span><code>{line || ' '}</code>{lineIndex === step.line && <span className="sr-only"> Current line</span>}</div>)}
    </div><div>{step.structure && <Structure structure={step.structure} previous={previous} />}<table className="trace-vars"><caption>Variables</caption><thead><tr><th scope="col">Name</th><th scope="col">Value</th></tr></thead><tbody>{Object.entries(step.vars).map(([name, value]) => {
      const changed = Boolean(previous) && (!Object.hasOwn(previous.vars, name) || previous.vars[name] !== value)
      return <tr key={name} className={changed ? 'trace-changed' : undefined}><th scope="row">{name}</th><td><code>{String(value)}</code>{changed && <span className="trace-change-label"> changed</span>}</td></tr>
    })}</tbody></table></div></div>
    <p className="trace-note" aria-live="polite" aria-atomic="true">Step {index + 1} of {trace.steps.length}: {step.note}</p>
    <div className="trace-controls"><Button disabled={index === 0} onClick={() => move(-1)}>Prev</Button><div className="trace-dots" aria-label="Trace steps">{trace.steps.map((_, dot) => <Button key={dot} variant="text" aria-label={`Go to step ${dot + 1}`} aria-current={dot === index ? 'step' : undefined} onClick={() => setIndex(dot)}><span aria-hidden="true" /></Button>)}</div><Button disabled={index === trace.steps.length - 1} onClick={() => move(1)}>Next</Button></div>
    <p className="utility-note">Use Left and Right arrow keys while focused here.</p>
  </section>
}
