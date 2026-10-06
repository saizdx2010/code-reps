import assert from 'node:assert/strict'
import test from 'node:test'
import { parseSessions, emptySessions, finishSession, mergeSessions, assertSessionRevision, sessionLimit } from '../src/practice-sessions.ts'
import { parseBackup } from '../src/portability.ts'
import { parseProfileBackup } from '../src/profile-backup.ts'
import { getAllJourneys } from '../src/learning.ts'

const repIds = new Set(['sum-positive-numbers'])
const record = { id: 'session-one', repId: 'sum-positive-numbers', startedAt: '2026-10-06T10:00:00Z', reflection: 'I got stuck on empty input.', hintCount: 0 }
const state = { version: 1, revision: 'revision-one', records: [record] }
const backup = { format: 'code-reps-backup', version: 1, learnerStart: null, history: [], drafts: {}, sessions: state }

test('unfinished and ended sessions round-trip without becoming skill evidence', () => {
  const ended = finishSession(record, '2026-10-06T10:20:00Z')
  assert.equal(parseSessions({ ...state, records: [ended] }, repIds).records[0].endedAt, ended.endedAt)
  assert.equal(getAllJourneys([], Date.now())[0].stage, 'learning')
  assert.throws(() => finishSession({ ...record, reflection: ' ' }, ended.endedAt), /reflection|learned/)
  assert.throws(() => finishSession(ended, ended.endedAt), /already ended/)
})

test('invalid session histories are rejected, including dates, identity, reflection, and limits', () => {
  for (const change of [{ repId: 'unknown' }, { hintCount: -1 }, { reflection: 'x'.repeat(2001) }, { difficulty: 'other' }, { startedAt: 'never' }, { endedAt: '2026-10-01T00:00:00Z' }, { attemptId: '../other' }]) {
    assert.throws(() => parseSessions({ ...state, records: [{ ...record, ...change }] }, repIds))
  }
  assert.throws(() => parseSessions({ ...state, records: [record, record] }, repIds), /duplicate/)
  assert.throws(() => parseSessions({ ...state, records: Array.from({ length: sessionLimit + 1 }, (_, i) => ({ ...record, id: `session-${i}` })) }, repIds), /full/)
  assert.throws(() => parseSessions({ ...state, records: Array.from({ length: 200 }, (_, i) => ({ ...record, id: `unicode-${i}`, reflection: '界'.repeat(2000) })) }, repIds), /full/)
  assert.throws(() => parseSessions({ ...state, records: [{ ...record, reflection: '', endedAt: '2026-10-06T12:00:00Z' }] }, repIds))
})

test('learner and full-profile backups validate sessions and accept legacy files', () => {
  assert.equal(parseBackup(JSON.stringify(backup), repIds).sessions.records[0].id, record.id)
  const legacy = { ...backup }; delete legacy.sessions
  assert.equal(parseBackup(JSON.stringify(legacy), repIds).sessions, undefined)
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, sessions: { ...state, records: [{ ...record, repId: 'unknown' }] } }), repIds))
  const profile = { format: 'code-reps-profile', version: 1, name: 'Learner', entries: { 'sessions:v1': JSON.stringify(state) } }
  assert.equal(parseProfileBackup(JSON.stringify(profile), repIds).entries['sessions:v1'], JSON.stringify(state))
  assert.throws(() => parseProfileBackup(JSON.stringify({ ...profile, entries: { 'sessions:v1': '{broken' } }), repIds))
  assert.throws(() => parseProfileBackup(JSON.stringify({ ...profile, entries: { 'sessions:v1': '' } }), repIds))
})

test('repeated imports preserve local edits and never silently change work references', () => {
  const local = { ...state, records: [{ ...record, reflection: 'Local edit', attemptId: 'local-attempt' }] }
  const imported = { ...state, records: [{ ...record, reflection: 'Old backup', attemptId: 'other-attempt' }, { ...record, id: 'session-two' }] }
  const merged = mergeSessions(local, imported, repIds)
  assert.equal(merged.records.length, 2)
  assert.equal(merged.records[0].reflection, 'Local edit')
  assert.equal(merged.records[0].attemptId, 'local-attempt')
  assert.equal(mergeSessions(merged, imported, repIds).records.length, 2)
  assert.deepEqual(mergeSessions(emptySessions(), state, repIds).records, state.records)
})

test('stale revision rejection keeps both session versions available for recovery', () => {
  assert.doesNotThrow(() => assertSessionRevision(null, null))
  assert.doesNotThrow(() => assertSessionRevision('same', 'same'))
  assert.throws(() => assertSessionRevision('old', 'new'), /another tab/)
  assert.throws(() => assertSessionRevision('old', null), /another tab/)
})
