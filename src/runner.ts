import { compileSolution } from './compile-solution.ts'
import { reps } from './rep.ts'
import { sameValue } from './compare.ts'
import type { TestResult } from './runner.types'

export function runRep(code: string, repId: string): TestResult[] {
  const rep = reps.find((item) => item.id === repId)
  if (!rep) throw new Error('This rep could not be found.')
  if (rep.format === 'frontend') throw new Error('This exercise uses browser interaction checks. Run it in the workspace.')
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('The solution is too large to run.')
  const outputText = compileSolution(code, rep.functionName)
  const solve = new Function(`${outputText}\nreturn typeof ${rep.functionName} === 'function' ? ${rep.functionName} : undefined`)() as unknown
  if (typeof solve !== 'function') throw new Error(`Define a function named ${rep.functionName}.`)
  return rep.checks.map(({ name, input, expected }) => {
    const inputPreview = `${rep.functionName}(${input.map((value) => JSON.stringify(value)).join(', ')})`.slice(0, 200)
    try {
      const argumentsCopy = structuredClone(input)
      const actual = (solve as (...values: unknown[]) => unknown)(...argumentsCopy)
      const changedInput = rep.preserveInput && !sameValue(argumentsCopy, input)
      const passed = sameValue(actual, expected) && !changedInput
      const format = (value: unknown) => { try { return JSON.stringify(value) ?? String(value) } catch { return String(value) } }
      return { name, passed, expected: passed ? undefined : format(expected), actual: passed ? undefined : format(actual), input: passed ? undefined : inputPreview, message: passed ? undefined : changedInput ? 'The function changed its input. Return the result without modifying the supplied arrays or objects.' : `Expected ${format(expected)}, received ${format(actual)}.` }
    } catch (error) {
      return { name, passed: false, input: inputPreview, message: error instanceof Error ? error.message : 'The solution threw an error.' }
    }
  })
}
