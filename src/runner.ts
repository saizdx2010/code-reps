import { createAsyncFixture } from './async-fixture.ts'
import { checkSqliteTask, isSqliteRep, type SqliteFactory } from './sqlite-task.ts'
import { compileSolution } from './compile-solution.ts'
import { reps } from './rep.ts'
import { sameValue } from './compare.ts'
import type { TestResult } from './runner.types'

export function runRep(code: string, repId: string, createDatabase?: SqliteFactory): TestResult[] {
  const rep = reps.find(item => item.id === repId)
  if (!rep) throw new Error('This rep could not be found.')
  if (rep.runtime) throw new Error('This rep requires the asynchronous fixture runner.')
  if (rep.format === 'frontend') throw new Error('This exercise uses browser interaction checks. Run it in the workspace.')
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('The solution is too large to run.')
  const outputText = compileSolution(code, rep.functionName)
  const solve = new Function(
    `${outputText}\nreturn typeof ${rep.functionName} === 'function' ? ${rep.functionName} : undefined`,
  )() as unknown
  if (typeof solve !== 'function') throw new Error(`Define a function named ${rep.functionName}.`)
  return rep.checks.map(({ name, input, expected }) => {
    const inputPreview = `${rep.functionName}(${input.map(value => JSON.stringify(value)).join(', ')})`.slice(0, 200)
    try {
      const argumentsCopy = structuredClone(input)
      const actual = isSqliteRep(rep.id)
        ? checkSqliteTask(
            rep.id,
            solve as (...values: unknown[]) => unknown,
            argumentsCopy,
            createDatabase ??
              (() => {
                throw new Error('SQLite must be loaded before running this rep.')
              }),
          )
        : (solve as (...values: unknown[]) => unknown)(...argumentsCopy)
      const changedInput = rep.preserveInput && !sameValue(argumentsCopy, input)
      const passed = sameValue(actual, expected) && !changedInput
      const format = (value: unknown) => {
        try {
          return JSON.stringify(value) ?? String(value)
        } catch {
          return String(value)
        }
      }
      return {
        name,
        passed,
        expected: passed ? undefined : format(expected),
        actual: passed ? undefined : format(actual),
        input: passed ? undefined : inputPreview,
        message: passed
          ? undefined
          : changedInput
            ? 'The function changed its input. Return the result without modifying the supplied arrays or objects.'
            : `Expected ${format(expected)}, received ${format(actual)}.`,
      }
    } catch (error) {
      return { name, passed: false, input: inputPreview, message: error instanceof Error ? error.message : 'The solution threw an error.' }
    }
  })
}

/** Async fixtures never cross postMessage: only authored serializable specifications do. */
export async function runAsyncRep(code: string, repId: string, createDatabase?: SqliteFactory): Promise<TestResult[]> {
  const rep = reps.find(item => item.id === repId)
  if (!rep) throw new Error('This rep could not be found.')
  if (isSqliteRep(rep.id)) return runRep(code, repId, createDatabase)
  if (rep.format === 'frontend') throw new Error('This exercise uses browser interaction checks. Run it in the workspace.')
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('The solution is too large to run.')
  const output = compileSolution(code, rep.functionName)
  const solve = new Function(`${output}\nreturn typeof ${rep.functionName} === 'function' ? ${rep.functionName} : undefined`)()
  if (typeof solve !== 'function') throw new Error(`Define a function named ${rep.functionName}.`)
  const results: TestResult[] = []
  for (const check of rep.checks) {
    if (rep.runtime && !check.fixture) throw new Error('Missing asynchronous fixture specification.')
    const args = structuredClone(check.input)
    const local = check.fixture ? createAsyncFixture(check.fixture) : undefined
    const events = local?.events
    try {
      const actual = await solve(...args, ...(local ? [local.fixture] : []))
      const changed = rep.preserveInput && !sameValue(args, check.input)
      const passed = sameValue(actual, check.expected) && sameValue(events, check.fixture?.events) && !changed
      results.push({
        name: check.name,
        passed,
        ...(passed
          ? {}
          : {
              input: `${rep.functionName}(${check.input.map(value => JSON.stringify(value)).join(', ')}${local ? ', fixture' : ''})`.slice(
                0,
                200,
              ),
              expected: formatResult(local ? { value: check.expected, events: check.fixture?.events } : check.expected),
              actual: formatResult(local ? { value: actual, events } : actual),
              message: changed
                ? 'The function changed its input. Return the result without modifying the supplied arrays or objects.'
                : local
                  ? 'The returned value or fixture lifecycle did not match the contract.'
                  : `Expected ${formatResult(check.expected)}, received ${formatResult(actual)}.`,
            }),
      })
    } catch (error) {
      results.push({ name: check.name, passed: false, message: error instanceof Error ? error.message : 'The solution rejected.' })
    }
  }
  return results
}

function formatResult(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}
