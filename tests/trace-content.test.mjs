import assert from 'node:assert/strict'
import test from 'node:test'
import { compileSolution } from '../src/compile-solution.ts'
import { reps } from '../src/rep.ts'
import { repDepth } from '../src/rep-depth.ts'
import { runRep } from '../src/runner.ts'

const traced = Object.entries(repDepth).filter(([, depth]) => depth.traceSteps)

test('traces cover collection operations, stacks, sets, and the authored algorithm techniques', () => {
  const ids = traced.map(([id]) => id)
  assert.deepEqual(ids.sort(), ['algo-binary-search', 'algo-graph-reachable', 'algo-insertion-sort', 'algo-merge-sorted', 'algo-recursive-sum', 'algo-sorted-pair', 'algo-tree-depth', 'algo-window-sum', 'balanced-brackets', 'ds-stack-operations', 'first-repeated-number', 'remaining-actions', 'remove-adjacent-pairs'])
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
    const result = Array.isArray(expected) ? JSON.parse(displayed) : displayed
    assert.deepEqual(result, expected)
  })
}
