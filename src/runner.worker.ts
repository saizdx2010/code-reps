import ts from 'typescript'
import { reps } from './rep'
import type { TestResult } from './runner.types'

type RunRequest = { code: string; repId: string }

self.onmessage = (event: MessageEvent<RunRequest>) => {
  try {
    const { code, repId } = event.data
    const rep = reps.find((item) => item.id === repId)
    if (!rep) throw new Error('This rep could not be found.')
    if (typeof code !== 'string' || code.length > 100_000) throw new Error('The solution is too large to run.')
    const output = ts.transpileModule(code, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
      reportDiagnostics: true,
    })
    const errors = output.diagnostics?.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
    if (errors.length) throw new Error(ts.flattenDiagnosticMessageText(errors[0].messageText, '\n'))
    const solve = new Function(`${output.outputText}\nreturn typeof ${rep.functionName} === 'function' ? ${rep.functionName} : undefined`)() as unknown
    if (typeof solve !== 'function') throw new Error(`Define a function named ${rep.functionName}.`)
    const results: TestResult[] = rep.checks.map(({ name, input, expected }) => {
      try {
        const args = structuredClone(input)
        const actual = (solve as (...values: unknown[]) => unknown)(...args)
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
