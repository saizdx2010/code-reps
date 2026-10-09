import assert from 'node:assert/strict'
import test from 'node:test'
import { compileSolution } from '../src/compile-solution.ts'
import { reps } from '../src/rep.ts'
import { repDepth } from '../src/rep-depth.ts'
import { runRep } from '../src/runner.ts'

const traced = Object.entries(repDepth).filter(([, depth]) => depth.traceSteps)

test('traces cover collection operations, stacks, sets, recursion, trees, and event-by-event state', () => {
  const ids = traced.map(([id]) => id)
  assert.deepEqual(ids.sort(), ['algo-binary-search', 'algo-graph-reachable', 'algo-insertion-sort', 'algo-merge-sorted', 'algo-recursive-sum', 'algo-sorted-pair', 'algo-tree-depth', 'algo-window-sum', 'balanced-brackets', 'debounce-schedule', 'ds-stack-operations', 'first-repeated-number', 'pubsub-trace', 'remaining-actions', 'remove-adjacent-pairs', 'search-request-state'])
})

// Parses "name = value, ..." by declaring the input as constants, then reads each binding.
function traceArguments(input) {
  const names = [...input.matchAll(/(\w+)\s*=/g)].map(match => match[1])
  return new Function(`const ${input}; return [${names.join(', ')}]`)()
}

for (const [id, depth] of traced) {
  test(`authored trace is structurally valid: ${id}`, () => {
    const { code, steps } = depth.traceSteps
    assert.ok(code.length >= 5 && code.length <= 12, 'code should be 5 to 12 lines')
    assert.ok(steps.length >= 6 && steps.length <= 12, 'trace should have 6 to 12 steps')
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
  const treeSteps = traced.flatMap(([, depth]) => depth.traceSteps.steps.filter(step => step.structure?.kind === 'tree'))
  const input = traceArguments(repDepth['algo-tree-depth'].traceSteps.input)[0]
  assert.ok(treeSteps.length > 0)
  const shape = node => ({ value: node.value, children: (node.children ?? []).map(shape) })
  for (const step of treeSteps) assert.deepEqual(shape(step.structure.root), strip(input))
  const calls = repDepth['algo-recursive-sum'].traceSteps.steps.map(step => step.structure)
  assert.equal(calls.at(-1).frames.length, 1)
  assert.equal(calls.at(-1).event, 'return')
  assert.ok(Math.max(...calls.map(structure => structure.frames.length)) >= 3, 'recursion should show nested frames')
})
