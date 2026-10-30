import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { TraceListNode, TraceStructure } from './rep-depth'
import { describeGraph, describeList } from './trace-describe.ts'

export type LegendMark = 'current' | 'visited' | 'queued' | 'edge' | 'null' | 'now' | 'reads' | 'empty'

/** A row of small marks, each beside a short label, in place of a sentence explaining the drawing. */
export function Legend({ items }: { items: readonly (readonly [LegendMark, ReactNode])[] }) {
  if (!items.length) return null
  return (
    <ul className="trace-legend" aria-hidden="true">
      {items.map(([mark, label]) => (
        <li key={mark}>
          <span className={`trace-key trace-key-${mark}`} />
          {label}
        </li>
      ))}
    </ul>
  )
}

/** Holds a drawing at a readable minimum width; it scrolls sideways (and takes focus) only when it overflows. */
export function Canvas({ width, children }: { width: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => setOverflows(node.scrollWidth > node.clientWidth + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [width])
  return (
    <div
      ref={ref}
      className="trace-canvas"
      style={{ ['--trace-min' as string]: `${Math.round(width * 0.78)}px` }}
      {...(overflows ? { role: 'group', 'aria-label': 'Drawing, scroll sideways to see all of it', tabIndex: 0 } : {})}
    >
      {children}
    </div>
  )
}

type ListStructure = Extract<TraceStructure, { kind: 'list' }>
type GraphStructure = Extract<TraceStructure, { kind: 'graph' }>
const LIST_W = 64,
  LIST_H = 40,
  LIST_GAP = 48,
  LIST_ROW = 148,
  LIST_PAD = 12

type PlacedNode = { node: TraceListNode; x: number; y: number; row: number; col: number }

function linkPath(from: PlacedNode, to: PlacedNode) {
  const midY = from.y + LIST_H / 2
  if (from.row !== to.row) {
    const down = to.row > from.row
    return `M ${from.x + LIST_W / 2} ${down ? from.y + LIST_H : from.y} L ${to.x + LIST_W / 2} ${down ? to.y : to.y + LIST_H}`
  }
  if (to.col === from.col + 1) return `M ${from.x + LIST_W} ${midY} L ${to.x} ${midY}`
  // Backward links arc above the row and longer forward links arc below it, so they never cross the nodes.
  const above = to.col < from.col
  const edge = above ? from.y : from.y + LIST_H
  const lift = Math.min(34, 18 + Math.abs(to.col - from.col) * 6) * (above ? -1 : 1)
  const startX = from.x + LIST_W / 2
  const endX = to.x + LIST_W / 2
  return `M ${startX} ${edge} C ${startX} ${edge + lift}, ${endX} ${edge + lift}, ${endX} ${edge}`
}

export function ListView({ structure, fresh = [] }: { structure: ListStructure; fresh?: string[] }) {
  const marker = `trace-arrow-${useId().replace(/:/g, '')}`
  const placed: PlacedNode[] = structure.rows.flatMap((row, rowIndex) =>
    row.nodes.map((node, col) => ({
      node,
      row: rowIndex,
      col,
      x: LIST_PAD + col * (LIST_W + LIST_GAP),
      y: rowIndex * LIST_ROW + (row.label ? 64 : 44),
    })),
  )
  const byId = new Map(placed.map(entry => [entry.node.id, entry]))
  const pointers = Object.entries(structure.pointers ?? {})
  const pointersAt = (id: string) => pointers.filter(([, target]) => target === id).map(([name]) => name)
  const nullPointers = pointers.filter(([, target]) => target === null).map(([name]) => name)
  const columns = Math.max(1, ...structure.rows.map(row => row.nodes.length))
  const width = LIST_PAD * 2 + columns * LIST_W + (columns - 1) * LIST_GAP + 40
  const height = structure.rows.length * LIST_ROW + 12
  return (
    <div className="trace-structure trace-list">
      <Canvas width={width}>
        <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <defs>
            <marker
              id={marker}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerUnits="userSpaceOnUse"
              markerWidth="10"
              markerHeight="10"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
          {structure.rows.map(
            (row, index) =>
              row.label && (
                <text key={`label-${index}`} className="trace-row-label" x={LIST_PAD} y={index * LIST_ROW + 18}>
                  {row.label}
                </text>
              ),
          )}
          {placed.map(entry => {
            const target = entry.node.next === null ? undefined : byId.get(entry.node.next)
            if (target)
              return <path key={`link-${entry.node.id}`} className="trace-link" d={linkPath(entry, target)} markerEnd={`url(#${marker})`} />
            const x = entry.x + LIST_W
            const y = entry.y + LIST_H / 2
            return (
              <g key={`link-${entry.node.id}`} className="trace-null">
                <path d={`M ${x} ${y} L ${x + 16} ${y} M ${x + 16} ${y - 8} L ${x + 16} ${y + 8}`} />
              </g>
            )
          })}
          {placed.map(({ node, x, y }) => (
            <g
              key={fresh.includes(node.id) ? `${node.id}-fresh` : node.id}
              className={
                [pointersAt(node.id).length ? 'trace-list-pointed' : '', fresh.includes(node.id) ? 'trace-fresh' : ''].join(' ').trim() ||
                undefined
              }
            >
              <rect x={x} y={y} width={LIST_W} height={LIST_H} rx={8} />
              <text x={x + LIST_W / 2} y={y + 25}>
                {node.value}
              </text>
            </g>
          ))}
          {/* Pointers are keyed by name, so a pointer that moves slides to its new node. */}
          {pointers.map(([name, target]) => {
            const at = target === null ? undefined : byId.get(target)
            if (!at) return null
            const stack = pointersAt(at.node.id).indexOf(name)
            return (
              <g
                key={name}
                className="trace-pointer"
                style={{ transform: `translate(${at.x + LIST_W / 2}px, ${at.y + LIST_H + 8 + stack * 24}px)` }}
              >
                <path d="M 0 0 L -6 10 L 6 10 Z" />
                <text y={23}>{name}</text>
              </g>
            )
          })}
        </svg>
      </Canvas>
      <Legend items={placed.some(entry => entry.node.next === null) || nullPointers.length ? [['null', 'next is null']] : []} />
      {nullPointers.length > 0 && (
        <p className="trace-legend" aria-hidden="true">
          {nullPointers.map(name => `${name} = null`).join(', ')}
        </p>
      )}
      <p className="sr-only">{describeList(structure)}</p>
    </div>
  )
}

const GRAPH_STEP_X = 96,
  GRAPH_STEP_Y = 84,
  GRAPH_RADIUS = 22,
  GRAPH_PAD = 34

export function GraphView({ structure }: { structure: GraphStructure }) {
  const marker = `trace-arrow-${useId().replace(/:/g, '')}`
  const point = (id: string) => {
    const node = structure.nodes.find(item => item.id === id)
    return node ? { x: GRAPH_PAD + node.at[0] * GRAPH_STEP_X, y: GRAPH_PAD + node.at[1] * GRAPH_STEP_Y } : undefined
  }
  const highlighted = (from: string, to: string) =>
    Boolean(structure.highlight?.some(([a, b]) => (a === from && b === to) || (!structure.directed && a === to && b === from)))
  const columns = Math.max(0, ...structure.nodes.map(node => node.at[0]))
  const rows = Math.max(0, ...structure.nodes.map(node => node.at[1]))
  const width = GRAPH_PAD * 2 + columns * GRAPH_STEP_X
  const height = GRAPH_PAD * 2 + rows * GRAPH_STEP_Y + 18
  return (
    <div className="trace-structure trace-graph">
      <Canvas width={width}>
        <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <defs>
            <marker
              id={marker}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerUnits="userSpaceOnUse"
              markerWidth="10"
              markerHeight="10"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
          {structure.edges.map(([from, to]) => {
            const a = point(from)
            const b = point(to)
            if (!a || !b) return null
            const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
            const ux = (b.x - a.x) / length
            const uy = (b.y - a.y) / length
            // A pair of opposite one-way edges is drawn as two parallel lines rather than one line with two heads.
            const paired = structure.directed && structure.edges.some(([c, d]) => c === to && d === from)
            const shift = paired ? 5 : 0
            const gap = structure.directed ? 4 : 0
            return (
              <line
                key={`${from}-${to}`}
                className={`trace-edge${highlighted(from, to) ? ' trace-edge-active' : ''}`}
                x1={a.x + ux * GRAPH_RADIUS - uy * shift}
                y1={a.y + uy * GRAPH_RADIUS + ux * shift}
                x2={b.x - ux * (GRAPH_RADIUS + gap) - uy * shift}
                y2={b.y - uy * (GRAPH_RADIUS + gap) + ux * shift}
                markerEnd={structure.directed ? `url(#${marker})` : undefined}
              />
            )
          })}
          {structure.nodes.map(node => {
            const { x, y } = point(node.id)!
            const state =
              node.id === structure.current
                ? 'trace-node-current'
                : structure.queued?.includes(node.id)
                  ? 'trace-node-queued'
                  : structure.visited?.includes(node.id)
                    ? 'trace-dimmed'
                    : undefined
            return (
              <g key={node.id} className={state}>
                {state === 'trace-node-queued' && <circle className="trace-node-ring" cx={x} cy={y} r={GRAPH_RADIUS + 5} />}
                <circle cx={x} cy={y} r={GRAPH_RADIUS} />
                <text x={x} y={y + 5}>
                  {node.label ?? node.id}
                </text>
                {node.note && (
                  <text className="trace-node-note" x={x} y={y + GRAPH_RADIUS + 16}>
                    {node.note}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </Canvas>
      <Legend
        items={[
          ...(structure.current !== undefined ? [['current', 'current'] as const] : []),
          ...(structure.queued?.length ? [['queued', 'waiting'] as const] : []),
          ...(structure.visited?.length ? [['visited', 'finished'] as const] : []),
          ...(structure.highlight?.length ? [['edge', 'following'] as const] : []),
        ]}
      />
      <p className="sr-only">{describeGraph(structure)}</p>
    </div>
  )
}
