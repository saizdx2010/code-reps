import assert from 'node:assert/strict'
import test from 'node:test'
import { compileSolution } from '../src/compile-solution.ts'
import { reps } from '../src/rep.ts'
import { repDepth } from '../src/rep-depth.ts'
import { runRep } from '../src/runner.ts'

const traced = Object.entries(repDepth).filter(([, depth]) => depth.traceSteps)

test('traces cover collection operations, stacks, sets, recursion, trees, tables, and event-by-event state', () => {
  const ids = traced.map(([id]) => id)
  assert.deepEqual(ids.sort(), ['algo-binary-search', 'algo-climb-stairs', 'algo-coin-change', 'algo-graph-reachable', 'algo-insertion-sort', 'algo-linked-list-reverse', 'algo-merge-intervals', 'algo-merge-sorted', 'algo-min-heap', 'algo-prefix-sums', 'algo-recursive-sum', 'algo-sorted-pair', 'algo-subsets', 'algo-tree-depth', 'algo-window-sum', 'balanced-brackets', 'count-object-leaves', 'debounce-schedule', 'ds-stack-operations', 'first-repeated-number', 'flatten-nested-numbers', 'graph-connected-groups', 'graph-shortest-hops', 'pubsub-trace', 'remaining-actions', 'remove-adjacent-pairs', 'search-request-state', 'tree-depth-sum', 'tree-value-path'])
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
    if (['algo-climb-stairs', 'algo-coin-change', 'algo-subsets', 'algo-min-heap', 'algo-linked-list-reverse', 'tree-depth-sum', 'tree-value-path', 'graph-shortest-hops', 'graph-connected-groups', 'flatten-nested-numbers', 'count-object-leaves', 'algo-prefix-sums', 'algo-merge-intervals'].includes(id)) assert.ok(steps.length <= 10, 'new advanced traces must have at most ten steps')
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
        assert.ok(structure.cells.every(row => row.length === width), 'table rows must be equal')
        assert.equal(structure.colLabels?.length ?? width, width)
        for (const [row, col] of [structure.current, ...(structure.reads ?? [])].filter(Boolean)) {
          assert.ok(row >= 0 && row < structure.cells.length && col >= 0 && col < width, 'table cell is out of range')
        }
        for (const [row, col] of structure.reads ?? []) assert.notEqual(structure.cells[row][col], null, 'a table never reads an unfilled cell')
      }
      if (structure?.kind === 'tree') {
        const ids = []
        const walk = node => { ids.push(node.id); node.children?.forEach(walk) }
        walk(structure.root)
        assert.equal(new Set(ids).size, ids.length, 'tree node ids must be unique')
        for (const ref of [structure.current, ...(structure.visited ?? [])].filter(Boolean)) assert.ok(ids.includes(ref), `unknown tree node ${ref}`)
      }
      if (structure?.kind === 'calls') {
        assert.ok(structure.frames.length > 0)
        assert.ok(structure.frames.slice(0, -1).every(frame => frame.returns === undefined), 'only the top frame may return')
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
      tables[step - 1].cells.forEach((row, r) => row.forEach((value, c) => { if (value !== null) assert.equal(tables[step].cells[r][c], value, `${id}: a filled cell must not change or empty`) }))
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
    const shapes = repDepth[id].traceSteps.steps.filter(step => step.structure?.kind === 'tree').map(step => JSON.stringify((function shape(node) { return { value: node.value, children: (node.children ?? []).map(shape) } })(step.structure.root)))
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
    const execute = new Function(`${compileSolution(code.join('\n'), rep.functionName)}\nconst snapshots = []; ${rep.functionName}(...arguments); return snapshots`)
    const actual = execute(...traceArguments(trace.input))
    const updates = trace.steps.filter(step => step.structure?.kind === 'table' && step.structure.current)
    assert.equal(updates.length, actual.length)
    for (let index = 0; index < actual.length; index++) {
      const row = updates[index].structure.cells[0]
      assert.deepEqual(row.filter(value => value !== null), actual[index].slice(0, row.filter(value => value !== null).length), `${id}: update ${index}`)
    }
  }
})
