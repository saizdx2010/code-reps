import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import { typescriptDepthSolutions } from './fixtures/typescript-depth-solutions.mjs'
import { runRep } from '../src/runner.ts'
import { compileSolution } from '../src/compile-solution.ts'
import { journeys, getJourney } from '../src/learning.ts'
import { assertMutantsFail } from './helpers/checks.mjs'

function diagnostics(source) {
  const directory = mkdtempSync(join(tmpdir(), 'code-reps-ts-depth-'))
  try {
    const file = join(directory, 'solution.ts')
    writeFileSync(file, source)
    const program = ts.createProgram([file], { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, types: [] })
    return ts.getPreEmitDiagnostics(program).filter(d => d.category === ts.DiagnosticCategory.Error)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('TypeScript reference implementations pass strict semantic checking outside the learner runner', () => {
  for (const [id, source] of Object.entries(typescriptDepthSolutions)) {
    assert.deepEqual(
      diagnostics(source).map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')),
      [],
      id,
    )
  }
})

test('generic API keeps payload types and rejects unsafe consumers under strict analysis', () => {
  const source = typescriptDepthSolutions['typed-record-lookup']
  assert.equal(
    diagnostics(
      source + "\nconst r = lookupRecord([{id:'a', score:0}], 'a'); if(r.kind === 'found') { const score: number = r.value.score }",
    ).length,
    0,
  )
  assert.ok(diagnostics(source + "\nconst r = lookupRecord([{id:'a', score:0}], 'a'); r.value.score").length > 0)
  assert.ok(
    diagnostics(
      source + "\nconst r = lookupRecord([{id:'a', score:0}], 'a'); if(r.kind === 'found') { const score: string = r.value.score }",
    ).length > 0,
  )
  const prefix = typescriptDepthSolutions['generic-prefix-copy']
  assert.equal(diagnostics(prefix + '\nconst values: string[] = takePrefix(["a"], 1)').length, 0)
  assert.ok(diagnostics(prefix + '\nconst values: number[] = takePrefix(["a"], 1)').length > 0)
})

test('an added union variant fails never analysis but current behavioral cases still pass', () => {
  const expanded = typescriptDepthSolutions['exhaustive-delivery-label'].replace('type Delivery =', "type Delivery = {kind: 'cancelled'} |")
  assert.ok(diagnostics(expanded).some(d => d.code === 2322))
  assert.ok(runRep(expanded, 'exhaustive-delivery-label').every(result => result.passed))
  assert.doesNotThrow(() => compileSolution('function example(): string { return 42 }', 'example'))
})

test('boundary checks reject coercion, changed duplicate precedence, and lost zero totals', () => {
  const mutants = [
    ['guard-contact-input', typescriptDepthSolutions['guard-contact-input'].replace("typeof value.subscribed === 'boolean'", 'true')],
    ['guard-contact-input', typescriptDepthSolutions['guard-contact-input'].replace('name.length <= 40', 'name.length < 40')],
    [
      'typed-record-lookup',
      typescriptDepthSolutions['typed-record-lookup'].replace(
        'for (const record of records)',
        'for (const record of [...records].reverse())',
      ),
    ],
    ['sensor-import-report', typescriptDepthSolutions['sensor-import-report'].replace('Number.isInteger(v.reading)', 'true')],
    [
      'sensor-import-report',
      typescriptDepthSolutions['sensor-import-report'].replace('[...groups].map', '[...groups].filter(([,total])=>total!==0).map'),
    ],
    [
      'generic-prefix-copy',
      typescriptDepthSolutions['generic-prefix-copy'].replace('output.push(items[i])', 'if (items[i]) output.push(items[i])'),
    ],
  ]
  assertMutantsFail(mutants)
})

test('typed boundaries recall needs fresh unhinted work after the delay', () => {
  const journey = journeys.find(j => j.id === 'typescript-boundaries')
  assert.equal(journey.recall, 'sensor-import-report')
  const records = [
    { repId: journey.guided, completedAt: '2026-01-01T00:00:00Z', hintCount: 1 },
    { repId: journey.independent, completedAt: '2026-01-02T00:00:00Z', hintCount: 0 },
  ]
  assert.equal(
    getJourney(journey, [...records, { repId: journey.recall, completedAt: '2026-01-04T00:00:00Z', hintCount: 0 }]).stage,
    'independent',
  )
  assert.equal(
    getJourney(journey, [...records, { repId: journey.recall, completedAt: '2026-01-05T00:00:00Z', hintCount: 1 }]).stage,
    'independent',
  )
  assert.equal(
    getJourney(journey, [...records, { repId: journey.recall, completedAt: '2026-01-05T00:00:00Z', hintCount: 0 }]).stage,
    'retained',
  )
})
