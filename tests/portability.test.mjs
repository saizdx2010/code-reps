import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BackupTooLargeError,
  UnrestorableBackupError,
  backupFileText,
  backupTextLimit,
  backupTooLargeMessage,
  mergeHistory,
  parseBackup,
} from '../src/portability.ts'
import { parseProfileBackup } from '../src/profile-backup.ts'

const known = new Set(['sum-positive-numbers'])
const attempt = { plan: 'Visit values', code: 'return 1', explanation: 'One pass', hintCount: 0 }
const restores = text => parseBackup(text, known)
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
  const measure = value => JSON.stringify(value, null, 2).length
  const empty = measure(largeBackup(0))
  const perRecord = measure(largeBackup(1)) - empty
  const records = Math.floor((length - empty) / perRecord)
  const extra = length - measure(largeBackup(records))
  assert.ok(extra >= 0 && extra <= 3 * 99_000, 'the last record can make up the difference')
  return largeBackup(records, extra)
}

test('an export just under the shared limit serializes and restores', () => {
  const large = backupOfLength(backupTextLimit - 1)
  const text = backupFileText(large, restores)
  assert.equal(text.length, backupTextLimit - 1)
  const restored = parseBackup(text, known)
  assert.equal(restored.history.length, large.history.length)
  assert.equal(restored.history.at(-1).plan, large.history.at(-1).plan)
})

test('an export over the shared limit is refused with a message instead of an unrestorable file', () => {
  const large = backupOfLength(backupTextLimit + 1)
  assert.throws(
    () => backupFileText(large, restores),
    error => error instanceof BackupTooLargeError && error.message === backupTooLargeMessage,
  )
  assert.match(backupTooLargeMessage, /20 MB/)
  assert.match(backupTooLargeMessage, /not downloaded/)
})

test('import still rejects backups and profiles over the shared limit', () => {
  const text = backupFileText(backupOfLength(backupTextLimit), restores)
  assert.equal(parseBackup(text, known).history.length > 0, true)
  assert.throws(() => parseBackup(`${text} `, known), /too large to import/)
  const profile = JSON.stringify({ format: 'code-reps-profile', version: 1, name: 'L', entries: {} })
  assert.equal(parseProfileBackup(profile, known).name, 'L')
  assert.throws(() => parseProfileBackup(profile.padEnd(backupTextLimit + 1), known), /import limit of 20 MB/)
})

test('an export import would reject is refused, and a long draft still round-trips', () => {
  // Editors do not limit text, so a draft longer than any old per-field cap must still restore.
  const long = { ...backup, drafts: { 'sum-positive-numbers': { ...attempt, code: 'x'.repeat(250_000) } } }
  assert.equal(parseBackup(backupFileText(long, restores), known).drafts['sum-positive-numbers'].code.length, 250_000)
  const unknown = { ...backup, drafts: { 'removed-rep': attempt } }
  assert.throws(
    () => backupFileText(unknown, restores),
    error => error instanceof UnrestorableBackupError && /invalid draft/.test(error.message) && /not downloaded/.test(error.message),
  )
})

test('a damaged profile file reports a readable error instead of a raw parse failure', () => {
  const profile = entries => JSON.stringify({ format: 'code-reps-profile', version: 1, name: 'L', entries })
  for (const key of ['sessions:v1', 'fluency:v1', 'history:v1']) {
    assert.throws(
      () => parseProfileBackup(profile({ [key]: '{broken' }), known),
      error => !(error instanceof SyntaxError) && /unreadable learner records/.test(error.message),
    )
  }
})
