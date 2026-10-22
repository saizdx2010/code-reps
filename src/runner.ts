// Runs a rep's checks by ID against the full catalog. Tests and scripts use this; the practice worker loads one rep at a time
// through src/rep-content.ts and calls src/run-rep.ts directly.
import { reps } from './rep.ts'
import { runRepChecks, runRepChecksAsync } from './run-rep.ts'
import type { SqliteFactory } from './sqlite-task.ts'
import type { Rep } from './rep-types.ts'
import type { TestResult } from './runner.types'

function findRep(repId: string): Rep {
  const rep = reps.find(item => item.id === repId)
  if (!rep) throw new Error('This rep could not be found.')
  return rep
}

/** Whether a rep's checks need the bundled SQLite engine. The worker loads it only for these reps. */
export const repNeedsSqlite = (repId: string) => Boolean(reps.find(item => item.id === repId)?.sql)

export function runRep(code: string, repId: string, createDatabase?: SqliteFactory): TestResult[] {
  return runRepChecks(code, findRep(repId), createDatabase)
}

/** Async fixtures never cross postMessage: only authored serializable specifications do. */
export async function runAsyncRep(code: string, repId: string, createDatabase?: SqliteFactory): Promise<TestResult[]> {
  return runRepChecksAsync(code, findRep(repId), createDatabase)
}
