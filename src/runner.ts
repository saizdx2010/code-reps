import ts from 'typescript'
import { reps } from './rep.ts'
import { sameValue } from './compare.ts'
import type { TestResult } from './runner.types'

export function runRep(code: string, repId: string): TestResult[] {
  const rep = reps.find((item) => item.id === repId)
  if (!rep) throw new Error('This rep could not be found.')
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('The solution is too large to run.')
  const output = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  })
  const errors = output.diagnostics?.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
  if (errors.length) throw new Error(ts.flattenDiagnosticMessageText(errors[0].messageText, '\n'))
  const solve = new Function(`${output.outputText}\nreturn typeof ${rep.functionName} === 'function' ? ${rep.functionName} : undefined`)() as unknown
  if (typeof solve !== 'function') throw new Error(`Define a function named ${rep.functionName}.`)
  return rep.checks.map(({ name, input, expected }) => {
    const inputPreview = `${rep.functionName}(${input.map((value) => JSON.stringify(value)).join(', ')})`.slice(0, 200)
    try {
      const actual = (solve as (...values: unknown[]) => unknown)(...structuredClone(input))
      const passed = sameValue(actual, expected)
      const format = (value: unknown) => { try { return JSON.stringify(value) ?? String(value) } catch { return String(value) } }
      return { name, passed, input: passed ? undefined : inputPreview, message: passed ? undefined : `Expected ${format(expected)}, received ${format(actual)}.` }
    } catch (error) {
      return { name, passed: false, input: inputPreview, message: error instanceof Error ? error.message : 'The solution threw an error.' }
    }
  })
}
