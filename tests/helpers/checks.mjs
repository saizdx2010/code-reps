import assert from 'node:assert/strict'
import { runRep } from '../../src/runner.ts'

/** Names of the authored checks a solution fails. */
export const failedChecks = (code, id) => runRep(code, id).filter(result => !result.passed).map(result => result.name)

/** Every [repId, code] mutant must fail at least one authored check. */
export function assertMutantsFail(mutants) {
  for (const [index, [id, code]] of mutants.entries()) assert.ok(runRep(code, id).some(result => !result.passed), `mutant ${index} of ${id} escaped the checks`)
}
