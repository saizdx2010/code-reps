import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeHistory, parseBackup } from '../src/portability.ts'

const known = new Set(['sum-positive-numbers'])
const attempt = { plan: 'Visit values', code: 'return 1', explanation: 'One pass', hintCount: 0 }
const backup = { format: 'code-reps-backup', version: 1, exportedAt: '2026-09-25T00:00:00.000Z', learnerStart: 'new',
  history: [{ ...attempt, id: 'one', repId: 'sum-positive-numbers', completedAt: '2026-09-25T00:00:00.000Z' }],
  drafts: { 'sum-positive-numbers': attempt } }

test('accepts a valid local backup and merges without duplicates', () => {
  assert.equal(parseBackup(JSON.stringify(backup), known).history.length, 1)
  assert.deepEqual(mergeHistory([{ id: 'one' }], [{ id: 'one' }, { id: 'two' }]), [{ id: 'one' }, { id: 'two' }])
})

test('rejects malformed and unknown content before importing', () => {
  assert.throws(() => parseBackup('not json', known))
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, version: 2 }), known))
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, drafts: { unknown: attempt } }), known))
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, history: [{ ...backup.history[0], completedAt: 'never' }] }), known))
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, drafts: { 'sum-positive-numbers': { ...attempt, confidence: 'wrong' } } }), known))
})
