import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BackupTooLargeError,
  backupFileText,
  backupTextLimit,
  backupTooLargeMessage,
  mergeHistory,
  parseBackup,
} from '../src/portability.ts'
import { parseProfileBackup } from '../src/profile-backup.ts'

const known = new Set(['sum-positive-numbers'])
const attempt = { plan: 'Visit values', code: 'return 1', explanation: 'One pass', hintCount: 0 }
const backup = {
  format: 'code-reps-backup',
  version: 1,
  exportedAt: '2026-09-25T00:00:00.000Z',
  learnerStart: 'new',
  history: [{ ...attempt, id: 'one', repId: 'sum-positive-numbers', completedAt: '2026-09-25T00:00:00.000Z' }],
  drafts: { 'sum-positive-numbers': attempt },
}

test('accepts a valid local backup and merges without duplicates', () => {
  assert.equal(parseBackup(JSON.stringify(backup), known).history.length, 1)
  assert.deepEqual(mergeHistory([{ id: 'one' }], [{ id: 'one' }, { id: 'two' }]), [{ id: 'one' }, { id: 'two' }])
})

test('rejects malformed and unknown content before importing', () => {
  assert.throws(() => parseBackup('not json', known))
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, version: 2 }), known))
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, drafts: { unknown: attempt } }), known))
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, history: [{ ...backup.history[0], completedAt: 'never' }] }), known))
  assert.throws(() =>
    parseBackup(JSON.stringify({ ...backup, drafts: { 'sum-positive-numbers': { ...attempt, confidence: 'wrong' } } }), known),
  )
})

// A backup of `records` full completed attempts plus one carrying `extra` characters, built from valid field sizes.
// Full records stay below what the last one can hold, so it can always make up the difference to an exact length.
function largeBackup(records, extra = 0) {
  const full = 'x'.repeat(98_000)
  const part = index => 'x'.repeat(Math.max(0, Math.min(99_000, extra - index * 99_000)))
  const record = (index, plan, code, explanation) => ({
    plan,
    code,
    explanation,
    hintCount: 0,
    id: `attempt-${String(index).padStart(5, '0')}`,
    repId: 'sum-positive-numbers',
    completedAt: '2026-09-25T00:00:00.000Z',
  })
  const history = Array.from({ length: records }, (_, index) => record(index, full, full, full))
  return { ...backup, history: [...history, record(records, part(0), part(1), part(2))] }
}

// Exact sizes come from measuring, so the test follows any change to the backup shape or its formatting.
function backupOfLength(length) {
  const empty = backupFileText(largeBackup(0)).length
  const perRecord = backupFileText(largeBackup(1)).length - empty
  const records = Math.floor((length - empty) / perRecord)
  const extra = length - backupFileText(largeBackup(records)).length
  assert.ok(extra >= 0 && extra <= 3 * 99_000, 'the last record can make up the difference')
  return largeBackup(records, extra)
}

test('an export just under the shared limit serializes and restores', () => {
  const large = backupOfLength(backupTextLimit - 1)
  const text = backupFileText(large)
  assert.equal(text.length, backupTextLimit - 1)
  const restored = parseBackup(text, known)
  assert.equal(restored.history.length, large.history.length)
  assert.equal(restored.history.at(-1).plan, large.history.at(-1).plan)
})

test('an export over the shared limit is refused with a message instead of an unrestorable file', () => {
  const large = backupOfLength(backupTextLimit + 1)
  assert.throws(
    () => backupFileText(large),
    error => error instanceof BackupTooLargeError && error.message === backupTooLargeMessage,
  )
  assert.match(backupTooLargeMessage, /20 MB/)
  assert.match(backupTooLargeMessage, /not downloaded/)
})

test('import still rejects backups and profiles over the shared limit', () => {
  const text = backupFileText(backupOfLength(backupTextLimit))
  assert.equal(parseBackup(text, known).history.length > 0, true)
  assert.throws(() => parseBackup(`${text} `, known), /too large to import/)
  const profile = JSON.stringify({ format: 'code-reps-profile', version: 1, name: 'L', entries: {} })
  assert.equal(parseProfileBackup(profile, known).name, 'L')
  assert.throws(() => parseProfileBackup(profile.padEnd(backupTextLimit + 1), known), /import limit of 20 MB/)
})
