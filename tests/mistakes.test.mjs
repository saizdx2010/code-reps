import assert from 'node:assert/strict'
import test from 'node:test'
import { mistakeTags, normalizeMistakes, summarizeMistakes } from '../src/mistakes.ts'
import { parseBackup } from '../src/portability.ts'
import { parseProfileBackup } from '../src/profile-backup.ts'
import { scopedKey } from '../src/profiles.ts'
import { createLocalStore } from '../src/local-store.ts'

const day = 86_400_000
const now = Date.parse('2026-10-10T12:00:00.000Z')
const ago = days => new Date(now - days * day).toISOString()
const rec = (id, days, mistakes, repId = 'sum-positive-numbers') => ({ id, repId, completedAt: ago(days), mistakes })

test('tag IDs are stable, unique, and normalization drops unknown or malformed values', () => {
  assert.deepEqual(mistakeTags.map(tag => tag.id), ['off-by-one', 'mutated-input', 'missed-empty-case', 'wrong-boundary-condition', 'misread-contract', 'type-or-null-handling', 'other'])
  assert.deepEqual(normalizeMistakes(['other', 'off-by-one', 'off-by-one', 'bogus', 7, null]), ['off-by-one', 'other'])
  assert.equal(normalizeMistakes(['bogus']), undefined)
  assert.equal(normalizeMistakes('off-by-one'), undefined)
  assert.equal(normalizeMistakes(undefined), undefined)
})

test('summary groups by tag, orders newest first, and ignores untagged, unknown, and undated attempts', () => {
  const groups = summarizeMistakes([
    rec('a', 1, ['off-by-one']), rec('b', 3, ['off-by-one', 'mutated-input']), rec('c', 5, undefined),
    rec('d', 2, ['bogus']), { id: 'e', repId: 'x', completedAt: 'never', mistakes: ['other'] },
  ], now)
  assert.deepEqual(groups.map(group => [group.id, group.total]), [['off-by-one', 2], ['mutated-input', 1]])
  assert.deepEqual(groups[0].occurrences.map(item => item.attemptId), ['a', 'b'])
  assert.equal(summarizeMistakes([], now).length, 0)
})

test('trend compares the last 14 days with the 14 days before', () => {
  const trend = history => summarizeMistakes(history, now)[0].trend
  assert.equal(trend([rec('a', 1, ['other'])]), 'new')
  assert.equal(trend([rec('a', 1, ['other']), rec('b', 2, ['other']), rec('c', 20, ['other'])]), 'more')
  assert.equal(trend([rec('a', 1, ['other']), rec('b', 20, ['other']), rec('c', 21, ['other'])]), 'fewer')
  assert.equal(trend([rec('a', 1, ['other']), rec('b', 20, ['other'])]), 'same')
  assert.equal(trend([rec('a', 40, ['other'])]), 'none')
  assert.equal(trend([rec('a', 1, ['other']), rec('b', 60, ['other'])]), 'more')
  assert.equal(trend([rec('a', 60, ['other']), rec('b', 1, ['other'])]), 'more')
})

test('occurrence list is capped per tag', () => {
  const history = Array.from({ length: 8 }, (_, index) => rec(`r${index}`, index, ['other']))
  const [group] = summarizeMistakes(history, now, 3)
  assert.equal(group.total, 8)
  assert.equal(group.occurrences.length, 3)
})

const known = new Set(['sum-positive-numbers'])
const attempt = { plan: 'p', code: 'c', explanation: 'e', hintCount: 0 }
const backup = (extra = {}, draftExtra = {}) => JSON.stringify({ format: 'code-reps-backup', version: 1, exportedAt: '', learnerStart: 'new',
  history: [{ ...attempt, id: 'one', repId: 'sum-positive-numbers', completedAt: ago(1), ...extra }],
  drafts: { 'sum-positive-numbers': { ...attempt, ...draftExtra } } })

test('older backups without tags load unchanged', () => {
  const parsed = parseBackup(backup(), known)
  assert.equal('mistakes' in parsed.history[0], false)
  assert.equal('mistakes' in parsed.drafts['sum-positive-numbers'], false)
})

test('tags round-trip through a backup, with unknown IDs dropped and other data kept', () => {
  const parsed = parseBackup(backup({ mistakes: ['off-by-one', 'future-tag'] }, { mistakes: ['other'] }), known)
  assert.deepEqual(parsed.history[0].mistakes, ['off-by-one'])
  assert.deepEqual(parsed.drafts['sum-positive-numbers'].mistakes, ['other'])
  assert.equal(parsed.history[0].plan, 'p')
  const again = parseBackup(JSON.stringify(parsed), known)
  assert.deepEqual(again.history[0].mistakes, ['off-by-one'])
  assert.equal('mistakes' in parseBackup(backup({ mistakes: ['future-tag'] }), known).history[0], false)
})

test('structurally invalid tags reject the backup like other invalid attempt fields', () => {
  assert.throws(() => parseBackup(backup({ mistakes: 'off-by-one' }), known), /invalid/)
  assert.throws(() => parseBackup(backup({ mistakes: [1] }), known), /invalid/)
})

test('profile exports accept tagged attempts and reject malformed tag fields', () => {
  const ids = known
  const profile = history => JSON.stringify({ format: 'code-reps-profile', version: 1, name: 'L', entries: { 'history:v1': JSON.stringify(history) } })
  const good = { ...attempt, id: 'one', repId: 'sum-positive-numbers', completedAt: ago(1), mistakes: ['off-by-one'] }
  assert.equal(parseProfileBackup(profile([good]), ids).name, 'L')
  assert.throws(() => parseProfileBackup(profile([{ ...good, mistakes: {} }]), ids))
})

test('tags stay with their own profile in synchronized storage', async () => {
  const data = new Map()
  const storage = { get length() { return data.size }, key: index => [...data.keys()][index] ?? null, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }
  let entries = {}
  const request = async (url, options) => {
    if (options?.method === 'PATCH') entries = { ...entries, ...JSON.parse(options.body).entries }
    return new Response(JSON.stringify({ entries }), { headers: { 'content-type': 'application/json' } })
  }
  const store = createLocalStore({ storage, request, onError() {} })
  await store.initializeStorage()
  const a = scopedKey('default', 'code-reps:history:v1'), b = scopedKey('other', 'code-reps:history:v1')
  store.localStore.setEntries({ [a]: JSON.stringify([rec('a', 1, ['other'])]), [b]: JSON.stringify([rec('b', 1)]) })
  await store.flushStorage()
  assert.deepEqual(JSON.parse(entries[a])[0].mistakes, ['other'])
  assert.equal(JSON.parse(entries[b])[0].mistakes, undefined)
})
