import ts from 'typescript'
import type { TestResult } from './runner.types'

const checks = [
  { name: 'Counts the example', input: [4, 2, 4, 2, 4, 3], expected: 4 },
  { name: 'Returns null for an empty array', input: [], expected: null },
  { name: 'Handles a single number', input: [7], expected: 7 },
  { name: 'Chooses the smaller number on a tie', input: [9, 2, 9, 2], expected: 2 },
  { name: 'Handles negative numbers', input: [-3, -1, -3, -1, -1], expected: -1 },
  { name: 'Counts repeated zeroes', input: [0, 5, 0, 1, 0], expected: 0 },
]

self.onmessage = (event: MessageEvent<{ code: string }>) => {
  try {
    const code = event.data.code
    if (typeof code !== 'string' || code.length > 100_000) throw new Error('The solution is too large to run.')
    const output = ts.transpileModule(code, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
      reportDiagnostics: true,
    })
    const errors = output.diagnostics?.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
    if (errors.length) throw new Error(ts.flattenDiagnosticMessageText(errors[0].messageText, '\n'))
    const solve = new Function(`${output.outputText}\nreturn typeof mostFrequent === 'function' ? mostFrequent : undefined`)() as unknown
    if (typeof solve !== 'function') throw new Error('Define a function named mostFrequent(numbers).')
    const results: TestResult[] = checks.map(({ name, input, expected }) => {
      try {
        const actual = (solve as (numbers: number[]) => unknown)([...input])
        const passed = Object.is(actual, expected)
        return { name, passed, message: passed ? undefined : `Expected ${String(expected)}, received ${String(actual)}.` }
      } catch (error) {
        return { name, passed: false, message: error instanceof Error ? error.message : 'The solution threw an error.' }
      }
    })
    self.postMessage({ results })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Could not run the solution.' })
  }
}
