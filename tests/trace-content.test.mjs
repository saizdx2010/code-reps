import assert from 'node:assert/strict'
import test from 'node:test'
import { compileSolution } from '../src/compile-solution.ts'
import { reps } from '../src/rep.ts'
import { repDepth } from '../src/rep-depth.ts'
import { runRep } from '../src/runner.ts'

const traced = Object.entries(repDepth).filter(([, depth]) => depth.traceSteps)

test('traces cover collection operations, stacks, sets, recursion, trees, tables, and event-by-event state', () => {
  const ids = traced.map(([id]) => id)
  assert.deepEqual(ids.sort(), [
    'algo-binary-search',
    'algo-climb-stairs',
    'algo-coin-change',
    'algo-graph-reachable',
    'algo-insertion-sort',
    'algo-linked-list-reverse',
    'algo-merge-intervals',
    'algo-merge-sorted',
    'algo-min-heap',
    'algo-prefix-sums',
    'algo-recursive-sum',
    'algo-sorted-pair',
    'algo-subsets',
    'algo-tree-depth',
    'algo-window-sum',
    'balanced-brackets',
    'broadcast-unreached-stations',
    'bst-check-order',
    'bst-insert-value',
    'bst-range-values',
    'bst-search-path',
    'closure-counters',
    'count-above-threshold',
    'count-even-numbers',
    'count-object-leaves',
    'count-record-highs',
    'count-unique-windows',
    'count-words',
    'course-order',
    'debounce-schedule',
    'debug-page-offset',
    'dispatch-priority-order',
    'dp-garage-paths',
    'dp-stall-revenue',
    'dp-tag-edits',
    'ds-stack-operations',
    'event-loop-order',
    'first-affordable-edition',
    'first-insertion-point',
    'first-long-word',
    'first-pair-to-target',
    'first-repeated-number',
    'first-unique-character',
    'flatten-nested-numbers',
    'frontend-list-summary',
    'frontend-view-state',
    'function-returns-function',
    'graph-connected-groups',
    'graph-shortest-hops',
    'grid-count-rooms',
    'grid-fewest-steps',
    'grid-open-neighbours',
    'has-duplicate',
    'heap-rooms-needed',
    'latest-request',
    'leading-throttle',
    'life-next-generation',
    'list-insert-sorted',
    'list-merge-sorted',
    'list-remove-value',
    'list-rotate-route',
    'longest-shared-sequence',
    'loop-while',
    'loop-with-for',
    'missing-number',
    'most-frequent-number',
    'nested-parcel-load',
    'next-warmer-day',
    'object-update',
    'preview-slot-results',
    'promise-outcomes',
    'pubsub-trace',
    'puzzle-adapt-part-two',
    'puzzle-parse-part-one',
    'quiet-sensor-span',
    'read-batch-labels',
    'remaining-actions',
    'remove-adjacent-pairs',
    'scroll-report-throttle',
    'search-request-state',
    'shipping-cost-tiers',
    'shortest-run-reaching-target',
    'simplify-file-path',
    'smallest-daily-capacity',
    'stack-trace-missing-field',
    'string-basics',
    'sum-positive-numbers',
    'terminal-folder-paths',
    'text-normalized-palindrome',
    'text-run-length',
    'top-k-frequent-tags',
    'tree-depth-sum',
    'tree-value-path',
    'use-conditions',
    'valid-parentheses',
    'validate-import-batch',
  ])
})

// Parses "name = value, ..." by declaring the input as constants, then reads each binding.
function traceArguments(input) {
  const names = [...input.matchAll(/(\w+)\s*=/g)].map(match => match[1])
  return new Function(`const ${input}; return [${names.join(', ')}]`)()
}

for (const [id, depth] of traced) {
  test(`authored trace is structurally valid: ${id}`, () => {
    const { code, steps } = depth.traceSteps
    assert.ok(code.length >= 5 && code.length <= 15, 'code should be 5 to 15 lines')
    assert.ok(steps.length >= 6 && steps.length <= 12, 'trace should have 6 to 12 steps')
    if (
      [
        'algo-climb-stairs',
        'algo-coin-change',
        'algo-subsets',
        'algo-min-heap',
        'algo-linked-list-reverse',
        'tree-depth-sum',
        'tree-value-path',
        'graph-shortest-hops',
        'graph-connected-groups',
        'flatten-nested-numbers',
        'count-object-leaves',
        'algo-prefix-sums',
        'algo-merge-intervals',
      ].includes(id)
    )
      assert.ok(steps.length <= 10, 'new advanced traces must have at most ten steps')
    for (const step of steps) {
      assert.ok(Number.isInteger(step.line) && step.line >= 0 && step.line < code.length, `line ${step.line} is out of range`)
      assert.ok(step.note.trim(), 'each step needs a note')
      for (const value of Object.values(step.vars)) assert.ok(['string', 'number', 'boolean'].includes(typeof value) || value === null)
      const { structure } = step
      if (structure?.kind === 'array') {
        const size = structure.values.length
        for (const index of Object.values(structure.pointers ?? {})) {
          assert.ok(Number.isInteger(index) && index >= 0 && index < size, `pointer ${index} is out of bounds`)
        }
        for (const index of structure.dimmed ?? []) {
          assert.ok(Number.isInteger(index) && index >= 0 && index < size, `dimmed index ${index} is out of bounds`)
        }
      }
      if (structure?.kind === 'table') {
        const width = structure.cells[0].length
        assert.ok(
          structure.cells.every(row => row.length === width),
          'table rows must be equal',
        )
        assert.equal(structure.colLabels?.length ?? width, width)
        for (const [row, col] of [structure.current, ...(structure.reads ?? [])].filter(Boolean)) {
          assert.ok(row >= 0 && row < structure.cells.length && col >= 0 && col < width, 'table cell is out of range')
        }
        for (const [row, col] of structure.reads ?? [])
          assert.notEqual(structure.cells[row][col], null, 'a table never reads an unfilled cell')
      }
      if (structure?.kind === 'tree') {
        const ids = []
        const walk = node => {
          ids.push(node.id)
          node.children?.forEach(walk)
        }
        walk(structure.root)
        assert.equal(new Set(ids).size, ids.length, 'tree node ids must be unique')
        for (const ref of [structure.current, ...(structure.visited ?? [])].filter(Boolean))
          assert.ok(ids.includes(ref), `unknown tree node ${ref}`)
      }
      if (structure?.kind === 'calls') {
        assert.ok(structure.frames.length > 0)
        assert.ok(
          structure.frames.slice(0, -1).every(frame => frame.returns === undefined),
          'only the top frame may return',
        )
        if (structure.event === 'return') assert.notEqual(structure.frames.at(-1).returns, undefined)
      }
    }
    assert.match(code[steps.at(-1).line], /\breturn\b/, 'the final step should be the return line')
  })

  test(`authored trace code is a correct solution and ends on the executed result: ${id}`, () => {
    const rep = reps.find(rep => rep.id === id)
    const source = depth.traceSteps.code.join('\n')
    assert.ok(runRep(source, id).every(check => check.passed))
    const solve = new Function(`${compileSolution(source, rep.functionName)}\nreturn ${rep.functionName}`)()
    const args = traceArguments(depth.traceSteps.input)
    const expected = solve(...structuredClone(args))
    // Snapshot variables render scalar labels, including array outputs as JSON text.
    const displayed = depth.traceSteps.steps.at(-1).vars.result
    const result = typeof expected === 'object' && expected !== null ? JSON.parse(displayed) : displayed
    assert.deepEqual(result, expected)
  })
}

test('tree traces draw the tree of the traced input and call stacks end with the outermost return', () => {
  const strip = node => ({ value: node.value, children: node.children.map(strip) })
  const treeSteps = repDepth['algo-tree-depth'].traceSteps.steps.filter(step => step.structure?.kind === 'tree')
  const input = traceArguments(repDepth['algo-tree-depth'].traceSteps.input)[0]
  assert.ok(treeSteps.length > 0)
  const shape = node => ({ value: node.value, children: (node.children ?? []).map(shape) })
  for (const step of treeSteps) assert.deepEqual(shape(step.structure.root), strip(input))
  const calls = repDepth['algo-recursive-sum'].traceSteps.steps.map(step => step.structure)
  assert.equal(calls.at(-1).frames.length, 1)
  assert.equal(calls.at(-1).event, 'return')
  assert.ok(Math.max(...calls.map(structure => structure.frames.length)) >= 3, 'recursion should show nested frames')
})

test('table traces fill monotonically and end with the executed answer in the table', () => {
  for (const id of ['algo-climb-stairs', 'algo-coin-change', 'algo-prefix-sums']) {
    const tables = repDepth[id].traceSteps.steps.map(step => step.structure).filter(structure => structure?.kind === 'table')
    assert.ok(tables.length >= 5, `${id} should show a table for most steps`)
    for (let step = 1; step < tables.length; step++) {
      tables[step - 1].cells.forEach((row, r) =>
        row.forEach((value, c) => {
          if (value !== null) assert.equal(tables[step].cells[r][c], value, `${id}: a filled cell must not change or empty`)
        }),
      )
    }
  }
  const stairs = repDepth['algo-climb-stairs'].traceSteps.steps
  assert.equal(stairs.at(-1).structure.cells[0].at(-1), stairs.at(-1).vars.result)
  const coins = repDepth['algo-coin-change'].traceSteps.steps
  assert.equal(coins.at(-1).structure.cells[0].at(-1), coins.at(-1).vars.result)
})

test('tree and call traces keep the traced input in every snapshot', () => {
  const stable = ['tree-depth-sum', 'tree-value-path', 'algo-subsets']
  for (const id of stable) {
    const shapes = repDepth[id].traceSteps.steps
      .filter(step => step.structure?.kind === 'tree')
      .map(step =>
        JSON.stringify(
          (function shape(node) {
            return { value: node.value, children: (node.children ?? []).map(shape) }
          })(step.structure.root),
        ),
      )
    assert.ok(shapes.length >= 6)
    assert.equal(new Set(shapes).size, 1, `${id}: tree shape changed between steps`)
  }
  for (const id of ['flatten-nested-numbers', 'count-object-leaves']) {
    const calls = repDepth[id].traceSteps.steps.map(step => step.structure)
    assert.equal(calls.at(-1).frames.length, 1)
    assert.equal(calls.at(-1).event, 'return')
    assert.ok(Math.max(...calls.map(structure => structure.frames.length)) >= 2, `${id} should show nested frames`)
  }
})

test('DP snapshots match intermediate values from executing the traced reference', () => {
  for (const [id, line, capture] of [
    ['algo-climb-stairs', 3, 'snapshots.push([...ways])'],
    ['algo-coin-change', 4, 'snapshots.push([...fewest])'],
  ]) {
    const trace = repDepth[id].traceSteps
    const code = [...trace.code]
    code[line] += `; ${capture}`
    const rep = reps.find(rep => rep.id === id)
    const execute = new Function(
      `${compileSolution(code.join('\n'), rep.functionName)}\nconst snapshots = []; ${rep.functionName}(...arguments); return snapshots`,
    )
    const actual = execute(...traceArguments(trace.input))
    const updates = trace.steps.filter(step => step.structure?.kind === 'table' && step.structure.current)
    assert.equal(updates.length, actual.length)
    for (let index = 0; index < actual.length; index++) {
      const row = updates[index].structure.cells[0]
      assert.deepEqual(
        row.filter(value => value !== null),
        actual[index].slice(0, row.filter(value => value !== null).length),
        `${id}: update ${index}`,
      )
    }
  }
})

test('alternative traces run as correct solutions and end on the executed result', () => {
  const alternatives = Object.entries(repDepth).filter(([, depth]) => depth.alternativeTrace)
  assert.deepEqual(
    alternatives.map(([id]) => id),
    ['algo-climb-stairs'],
  )
  for (const [id, depth] of alternatives) {
    const { code, input, steps } = depth.alternativeTrace.trace
    const rep = reps.find(rep => rep.id === id)
    const source = code.join('\n')
    assert.ok(
      runRep(source, id).every(check => check.passed),
      `${id}: alternative trace code must pass the checks`,
    )
    const solve = new Function(`${compileSolution(source, rep.functionName)}\nreturn ${rep.functionName}`)()
    assert.equal(steps.at(-1).vars.result, solve(...traceArguments(input)))
    assert.match(code[steps.at(-1).line], /\breturn\b/)
  }
  const cached = repDepth['algo-climb-stairs'].alternativeTrace.trace.steps.filter(step => step.structure?.cached?.length)
  assert.ok(cached.length > 0, 'the memoized trace should show a call answered from the memo')
})

// Follows next links from a node id and returns the values, guarding against cycles.
function listValues(structure, id) {
  const byId = new Map(structure.rows.flatMap(row => row.nodes).map(node => [node.id, node]))
  const values = []
  for (let at = id; at !== null && values.length <= byId.size; at = byId.get(at).next) values.push(byId.get(at).value)
  return values
}

test('linked-list traces keep the input row intact and return the drawn copy', () => {
  for (const id of ['algo-linked-list-reverse', 'list-insert-sorted', 'list-remove-value']) {
    const { input, steps } = repDepth[id].traceSteps
    const lists = steps.map(step => step.structure).filter(structure => structure?.kind === 'list')
    assert.equal(lists.length, steps.length, `${id}: every step should draw the list`)
    const head = traceArguments(input)[0]
    const expectedInput = []
    for (let node = head; node; node = node.next) expectedInput.push(node.value)
    for (const list of lists) assert.deepEqual(listValues(list, list.rows[0].nodes[0].id), expectedInput, `${id}: input row changed`)
    const last = lists.at(-1)
    const resultId = last.pointers.result ?? last.pointers.reversed
    const expected = []
    for (let node = JSON.parse(steps.at(-1).vars.result); node; node = node.next) expected.push(node.value)
    assert.deepEqual(listValues(last, resultId), expected, `${id}: the drawn result differs from the returned list`)
  }
})

test('graph traces keep every node in place and draw the traced edges', () => {
  for (const id of ['algo-graph-reachable', 'graph-shortest-hops', 'graph-connected-groups', 'course-order']) {
    const graphs = repDepth[id].traceSteps.steps.map(step => step.structure).filter(structure => structure?.kind === 'graph')
    assert.equal(graphs.length, repDepth[id].traceSteps.steps.length, `${id}: every step should draw the graph`)
    const layout = graph => JSON.stringify(graph.nodes.map(node => [node.id, node.at]))
    assert.equal(new Set(graphs.map(layout)).size, 1, `${id}: a node moved between steps`)
  }
  for (const id of ['algo-graph-reachable', 'graph-shortest-hops', 'graph-connected-groups']) {
    const [graph] = traceArguments(repDepth[id].traceSteps.input)
    const drawn = repDepth[id].traceSteps.steps[0].structure
    const listed = graph.flatMap((targets, from) => targets.map(to => [String(from), String(to)]))
    const key = ([a, b]) => (drawn.directed ? `${a}>${b}` : [a, b].sort().join('-'))
    assert.deepEqual([...new Set(listed.map(key))].sort(), drawn.edges.map(key).sort(), `${id}: drawn edges differ from the input`)
  }
})

test('window brackets sit between the traced start and end pointers', () => {
  for (const id of ['algo-window-sum', 'count-unique-windows', 'quiet-sensor-span', 'shortest-run-reaching-target']) {
    for (const step of repDepth[id].traceSteps.steps) {
      const { pointers, window } = step.structure ?? {}
      if (pointers?.start === undefined) continue
      assert.deepEqual(window, [pointers.start, pointers.end], `${id}: window should match start and end`)
    }
  }
})
