import type { TraceStructure } from './rep-depth.ts'

type ListStructure = Extract<TraceStructure, { kind: 'list' }>
type GraphStructure = Extract<TraceStructure, { kind: 'graph' }>

// Screen-reader text for the drawn linked-list and graph snapshots; the drawings themselves are hidden from assistive technology.
const joinList = (items: string[]) => items.join(', ') || 'none'

export function describeList(list: ListStructure) {
  const byId = new Map(list.rows.flatMap(row => row.nodes).map(node => [node.id, node]))
  const name = (id: string | null) => (id === null ? 'null' : String(byId.get(id)?.value ?? id))
  const rows = list.rows
    .map(row => {
      const links = row.nodes.map(node => `${node.value} links to ${name(node.next)}`).join(', ')
      return `${row.label ? `${row.label}: ` : ''}${links || 'no nodes'}`
    })
    .join('; ')
  const pointers = Object.entries(list.pointers ?? {}).map(([pointer, id]) => `${pointer} at ${name(id)}`)
  return `Linked list. ${rows}. Pointers: ${joinList(pointers)}.`
}

export function describeGraph(graph: GraphStructure) {
  const label = (id: string) => String(graph.nodes.find(node => node.id === id)?.label ?? id)
  const arrow = graph.directed ? ' to ' : ' with '
  const edges = graph.edges.map(([from, to]) => `${label(from)}${arrow}${label(to)}`)
  const notes = graph.nodes.filter(node => node.note).map(node => `${label(node.id)} (${node.note})`)
  return (
    `${graph.directed ? 'Directed graph' : 'Graph'} with nodes ${joinList(graph.nodes.map(node => label(node.id)))}. ` +
    `${graph.directed ? 'Edges' : 'Connections'}: ${joinList(edges)}. ` +
    `Current node: ${graph.current ? label(graph.current) : 'none'}. ` +
    `Queued: ${joinList((graph.queued ?? []).map(label))}. Visited: ${joinList((graph.visited ?? []).map(label))}.` +
    (graph.highlight?.length ? ` Followed: ${graph.highlight.map(([from, to]) => `${label(from)} to ${label(to)}`).join(', ')}.` : '') +
    (notes.length ? ` Notes: ${notes.join(', ')}.` : '')
  )
}
