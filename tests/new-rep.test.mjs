import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { renderRepSkeleton, validateModuleFile, validateRepId } from '../scripts/new-rep.mjs'
import { reps } from '../src/rep.ts'

const usedIds = new Set(reps.map(rep => rep.id))
const script = fileURLToPath(new URL('../scripts/new-rep.mjs', import.meta.url))

test('rep ids must be kebab-case and unused', () => {
  assert.equal(validateRepId('sum-evens', usedIds), null)
  assert.equal(validateRepId('sum2', usedIds), null)
  for (const id of ['', 'Sum-Evens', 'sum_evens', 'sum evens', 'sum--evens', '-sum', 'sum-', '2sum']) {
    assert.match(validateRepId(id, usedIds) ?? '', /kebab-case|Give a rep id/, `${JSON.stringify(id)} should be rejected`)
  }
  const [existing] = reps
  assert.match(validateRepId(existing.id, usedIds) ?? '', /already used/)
})

test('every existing rep id passes the kebab-case rule', () => {
  const rejected = reps.map(rep => rep.id).filter(id => validateRepId(id, new Set()) !== null)
  assert.deepEqual(rejected, [])
})

test('module files must be content modules directly in src', () => {
  assert.equal(validateModuleFile('src/foundations.ts'), null)
  for (const file of ['', 'foundations.ts', './src/foundations.ts', 'src/nested/foundations.ts', 'src/foundations.tsx', 'src/review-dsa.ts']) {
    assert.notEqual(validateModuleFile(file), null, `${JSON.stringify(file)} should be rejected`)
  }
})

test('the skeleton contains every required rep field and authoring block', () => {
  const output = renderRepSkeleton({ id: 'sum-evens', moduleFile: 'src/foundations.ts' })
  for (const field of ['id', 'title', 'category', 'prompt', 'example', 'note', 'vocabulary', 'planPrompt', 'starter', 'functionName', 'hints', 'checks']) {
    assert.match(output, new RegExp(`\\n {2}${field}: `), `missing field ${field}`)
  }
  assert.match(output, /id: 'sum-evens'/)
  assert.match(output, /functionName: 'sumEvens'/)
  assert.match(output, /function sumEvens\(/)
  assert.match(output, /'sum-evens': \{\n {2}reasoning:/)
  assert.match(output, /'sum-evens': \{\n {2}plan:/)
  assert.match(output, /'sum-evens': 'TODO: a complete TypeScript function named sumEvens/)
  assert.match(output, /TODO/)
})

test('the checklist names the follow-up gates and the glossary', () => {
  const output = renderRepSkeleton({ id: 'sum-evens', moduleFile: 'src/foundations.ts' })
  for (const step of ['src/vocabulary-id.ts', 'src/rep-levels.ts', 'yarn content:index', 'yarn content:check', 'tests/content.test.mjs', 'yarn test', 'yarn lint', 'yarn build']) {
    assert.ok(output.includes(step), `checklist should mention ${step}`)
  }
})

test('the command prints a skeleton for a valid id and exits 0', () => {
  const result = spawnSync(process.execPath, ['--experimental-strip-types', script, 'sum-evens', 'src/foundations.ts'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /1\. Rep object/)
})

test('the command refuses used ids, bad modules, and missing arguments', () => {
  const used = spawnSync(process.execPath, ['--experimental-strip-types', script, reps[0].id, 'src/foundations.ts'], { encoding: 'utf8' })
  assert.equal(used.status, 1)
  assert.match(used.stderr, /already used/)
  const missing = spawnSync(process.execPath, ['--experimental-strip-types', script, 'sum-evens', 'src/not-a-module.ts'], { encoding: 'utf8' })
  assert.equal(missing.status, 1)
  assert.match(missing.stderr, /does not exist/)
  const usage = spawnSync(process.execPath, ['--experimental-strip-types', script], { encoding: 'utf8' })
  assert.equal(usage.status, 2)
  assert.match(usage.stderr, /Usage: yarn rep:new/)
})
