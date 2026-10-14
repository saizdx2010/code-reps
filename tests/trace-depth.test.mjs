import test from 'node:test'
import assert from 'node:assert/strict'
import { validateContentDepth } from '../src/content-depth.ts'
const trace = {
  code: ['initialize', 'return'],
  input: '[1]',
  steps: [
    { line: 0, vars: { total: 0 }, structure: { kind: 'array', values: [1], pointers: { current: 0 } }, note: 'Start' },
    { line: 1, vars: { total: 1 }, note: 'Return' },
  ],
}
function validate(traceSteps) {
  return validateContentDepth(
    new Set(['demo']),
    new Set(),
    { demo: { reasoning: 'Why', trace: 'Prose', alternative: 'Other', counterexample: 'Mistake', transfer: 'Variation', traceSteps } },
    {},
  )
}
test('optional trace accepts valid snapshots and preserves prose-only reviews', () => {
  assert.deepEqual(validate(trace), [])
  assert.deepEqual(validate(undefined), [])
  for (const structure of [
    { kind: 'stack', values: [] },
    { kind: 'map', entries: [['one', 1]] },
  ]) {
    assert.deepEqual(validate({ ...trace, steps: [{ ...trace.steps[0], structure }, trace.steps[1]] }), [])
  }
})
test('trace rejects empty code, short sequences, invalid lines, pointers and notes', () => {
  assert.match(validate({ ...trace, code: [] }).join(), /code must be non-empty/)
  assert.match(validate({ ...trace, code: [' '] }).join(), /code must be non-empty/)
  assert.match(validate({ ...trace, steps: trace.steps.slice(0, 1) }).join(), /at least two/)
  for (const line of [-1, 2, 0.5])
    assert.match(validate({ ...trace, steps: [{ ...trace.steps[0], line }, trace.steps[1]] }).join(), /line is out of bounds/)
  for (const current of [-1, 1, 0.5])
    assert.match(
      validate({
        ...trace,
        steps: [{ ...trace.steps[0], structure: { kind: 'array', values: [1], pointers: { current } } }, trace.steps[1]],
      }).join(),
      /pointer is out of bounds/,
    )
  assert.match(validate({ ...trace, steps: [{ ...trace.steps[0], note: ' ' }, trace.steps[1]] }).join(), /needs a note/)
})

const node = (id, children = []) => ({ id, value: id, children })
const wrap = structure => ({ ...trace, steps: [{ ...trace.steps[0], structure }, trace.steps[1]] })
test('new structures accept valid snapshots', () => {
  assert.deepEqual(validate(wrap({ kind: 'tree', root: node('a', [node('b')]), current: 'b', visited: ['a'] })), [])
  assert.deepEqual(validate(wrap({ kind: 'calls', frames: [{ call: 'f(1)' }, { call: 'f(0)', returns: 0 }], event: 'return' })), [])
  assert.deepEqual(validate(wrap({ kind: 'state', entries: [['status', 'idle']], events: ['start'], eventIndex: 0 })), [])
})
test('tree, call stack, and state snapshots reject inconsistent references', () => {
  assert.match(validate(wrap({ kind: 'tree', root: node('a', [node('a')]) })).join(), /duplicate node id/)
  assert.match(validate(wrap({ kind: 'tree', root: node('a'), current: 'z' })).join(), /unknown node/)
  assert.match(validate(wrap({ kind: 'tree', root: node('a'), visited: ['z'] })).join(), /unknown node/)
  assert.match(validate(wrap({ kind: 'calls', frames: [] })).join(), /needs a frame/)
  assert.match(validate(wrap({ kind: 'calls', frames: [{ call: 'f', returns: 1 }, { call: 'g' }] })).join(), /only the top frame/)
  assert.match(validate(wrap({ kind: 'calls', frames: [{ call: 'f' }], event: 'return' })).join(), /needs a return value/)
  for (const eventIndex of [-1, 1, 0.5])
    assert.match(validate(wrap({ kind: 'state', entries: [], events: ['start'], eventIndex })).join(), /event index/)
})

test('table snapshots accept 1D and 2D tables and reject inconsistent cells', () => {
  const table = (extra = {}) => wrap({ kind: 'table', cells: [[1, null, null]], ...extra })
  assert.deepEqual(validate(table({ colLabels: ['0', '1', '2'], current: [0, 1], reads: [[0, 0]] })), [])
  assert.deepEqual(
    validate(
      wrap({
        kind: 'table',
        cells: [
          [1, 2],
          [3, null],
        ],
        rowLabels: ['a', 'b'],
        current: [1, 1],
        reads: [
          [0, 1],
          [1, 0],
        ],
      }),
    ),
    [],
  )
  assert.deepEqual(validate(table({ reads: [[0, 0]] })), [])
  assert.match(validate(wrap({ kind: 'table', cells: [[1], [1, 2]] })).join(), /equal, non-empty rows/)
  assert.match(validate(wrap({ kind: 'table', cells: [] })).join(), /equal, non-empty rows/)
  assert.match(validate(table({ colLabels: ['0'] })).join(), /column labels/)
  assert.match(validate(table({ rowLabels: ['a', 'b'] })).join(), /row labels/)
  for (const current of [
    [0, 3],
    [1, 0],
    [-1, 0],
    [0, 0.5],
  ])
    assert.match(validate(table({ current })).join(), /out of bounds/)
  assert.match(validate(table({ current: [0, 1], reads: [[0, 5]] })).join(), /out of bounds/)
  assert.match(validate(table({ current: [0, 1], reads: [[0, 1]] })).join(), /read itself/)
  assert.match(validate(table({ current: [0, 1], reads: [[0, 2]] })).join(), /unfilled cell/)
})

test('list, graph, window, and cached snapshots reject inconsistent references', () => {
  const list = (nodes, pointers) => ({ kind: 'list', rows: [{ nodes }], pointers })
  assert.deepEqual(validate(wrap(list([{ id: 'a', value: 1, next: null }], { head: 'a', tail: null }))), [])
  assert.match(validate(wrap(list([{ id: 'a', value: 1, next: 'z' }]))).join(), /links to an unknown node/)
  assert.match(validate(wrap(list([{ id: 'a', value: 1, next: null }], { head: 'z' }))).join(), /pointer names an unknown node/)
  assert.match(
    validate(
      wrap(
        list([
          { id: 'a', value: 1, next: null },
          { id: 'a', value: 2, next: null },
        ]),
      ),
    ).join(),
    /duplicate node id/,
  )
  const graph = extra => ({
    kind: 'graph',
    nodes: [
      { id: 'a', at: [0, 0] },
      { id: 'b', at: [1, 0] },
    ],
    edges: [['a', 'b']],
    ...extra,
  })
  assert.deepEqual(validate(wrap(graph({ current: 'a', queued: ['b'], highlight: [['b', 'a']] }))), [])
  assert.match(validate(wrap(graph({ directed: true, highlight: [['b', 'a']] }))).join(), /highlights a missing edge/)
  assert.match(validate(wrap(graph({ visited: ['z'] }))).join(), /unknown node/)
  assert.match(
    validate(
      wrap(
        graph({
          nodes: [
            { id: 'a', at: [0, 0] },
            { id: 'b', at: [0, 0] },
          ],
        }),
      ),
    ).join(),
    /two nodes at one point/,
  )
  const array = window => ({ kind: 'array', values: [1, 2, 3], window })
  assert.deepEqual(validate(wrap(array([0, 2]))), [])
  for (const window of [
    [2, 1],
    [0, 3],
    [-1, 0],
  ])
    assert.match(validate(wrap(array(window))).join(), /window is out of bounds/)
  assert.match(validate(wrap({ kind: 'tree', root: node('a'), cached: ['z'] })).join(), /unknown node/)
})

test('alternative traces need a title and valid steps', () => {
  const review = alternativeTrace =>
    validateContentDepth(
      new Set(['demo']),
      new Set(),
      {
        demo: {
          reasoning: 'Why',
          trace: 'Prose',
          alternative: 'Other',
          counterexample: 'Mistake',
          transfer: 'Variation',
          alternativeTrace,
        },
      },
      {},
    )
  assert.deepEqual(review({ title: 'Top down', trace }), [])
  assert.match(review({ title: ' ', trace }).join(), /alternative trace needs a title/)
  assert.match(
    review({ title: 'Top down', trace: { ...trace, steps: trace.steps.slice(0, 1) } }).join(),
    /alternative\): trace needs at least two/,
  )
})
