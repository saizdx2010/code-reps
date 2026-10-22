// Runs one rep's authored checks against learner code. The rep is passed in, so the practice worker loads only the open rep.
import { createAsyncFixture } from './async-fixture.ts'
import { expectedOutcome, judgeSql, observeSql, observeSqlFunction, type SqliteFactory } from './sqlite-task.ts'
import { compileSolution } from './compile-solution.ts'
import { sameValue } from './compare.ts'
import type { Rep } from './rep-types.ts'
import type { TestResult } from './runner.types'

const missingSqlite: SqliteFactory = () => {
  throw new Error('SQLite must be loaded before running this rep.')
}

/** Learner SQL text runs as written against each check's fresh database; there is no function to compile. */
function runSqlRep(code: string, rep: Rep & { sql: NonNullable<Rep['sql']> }, createDatabase: SqliteFactory): TestResult[] {
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('The SQL is too large to run.')
  return rep.checks.map(check => {
    const seed = check.sql ? rep.sql.seeds[check.sql.seed] : undefined
    const input = seed ? `Starting data: ${seed.about}` : undefined
    try {
      if (!check.sql) throw new Error('Missing SQLite check specification.')
      const verdict = judgeSql(rep.sql, check, observeSql(rep.sql, check.sql, code, createDatabase))
      const plan = verdict.plan ? { plan: verdict.plan } : {}
      return verdict.passed
        ? { name: check.name, passed: true, ...plan }
        : {
            name: check.name,
            passed: false,
            input,
            message: verdict.message,
            ...(verdict.tables.length ? { tables: verdict.tables } : {}),
            ...(verdict.sqlError ? { sqlError: verdict.sqlError } : {}),
            ...plan,
          }
    } catch (error) {
      return {
        name: check.name,
        passed: false,
        input,
        message: error instanceof Error ? error.message : 'SQLite could not run the checks.',
      }
    }
  })
}

export function runRepChecks(code: string, rep: Rep, createDatabase?: SqliteFactory): TestResult[] {
  if (rep.runtime) throw new Error('This rep requires the asynchronous fixture runner.')
  if (rep.sql && rep.format === 'sql') return runSqlRep(code, { ...rep, sql: rep.sql }, createDatabase ?? missingSqlite)
  if (rep.format === 'frontend') throw new Error('This exercise uses browser interaction checks. Run it in the workspace.')
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('The solution is too large to run.')
  const outputText = compileSolution(code, rep.functionName)
  const solve = new Function(
    `${outputText}\nreturn typeof ${rep.functionName} === 'function' ? ${rep.functionName} : undefined`,
  )() as unknown
  if (typeof solve !== 'function') throw new Error(`Define a function named ${rep.functionName}.`)
  return rep.checks.map(({ name, input, expected, sql }) => {
    // A SQLite function receives the database first; its starting data is part of the input the learner needs to see.
    const seed = rep.sql && sql ? rep.sql.seeds[sql.seed] : undefined
    const inputPreview = `${rep.functionName}(${[...(rep.sql ? ['db'] : []), ...input.map(value => JSON.stringify(value))].join(', ')})${
      seed ? ` with ${seed.about}` : ''
    }`.slice(0, 200)
    try {
      const argumentsCopy = structuredClone(input)
      if (rep.sql && !sql) throw new Error('Missing SQLite check specification.')
      const actual =
        rep.sql && sql
          ? observeSqlFunction(rep.sql, sql, solve as (...values: unknown[]) => unknown, argumentsCopy, createDatabase ?? missingSqlite)
              .outcome
          : (solve as (...values: unknown[]) => unknown)(...argumentsCopy)
      const changedInput = rep.preserveInput && !sameValue(argumentsCopy, input)
      const passed = sameValue(actual, rep.sql ? expectedOutcome(rep.sql, expected) : expected) && !changedInput
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
export async function runRepChecksAsync(code: string, rep: Rep, createDatabase?: SqliteFactory): Promise<TestResult[]> {
  if (rep.sql) return runRepChecks(code, rep, createDatabase)
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
