import assert from 'node:assert/strict'
import test from 'node:test'
import { difficultyLabels, isDifficulty } from '../src/attempt-labels.ts'
import { mistakeTags } from '../src/mistakes.ts'
import { mistakeHelp } from '../src/mistake-help.ts'
import { parseBackup } from '../src/portability.ts'
import { skillIndex } from '../src/catalog-index.ts'
import { stuckAdvice, summarizeStuckPoints } from '../src/stuck.ts'

const day = 86_400_000
const now = Date.parse('2026-10-10T12:00:00.000Z')
const ago = days => new Date(now - days * day).toISOString()
const rec = (repId, difficulty, days) => ({ id: `${repId}-${days}`, repId, difficulty, completedAt: ago(days) })

test('difficulty values keep their stored IDs, append the new ones, and each stuck kind has advice', () => {
  assert.deepEqual(Object.keys(difficultyLabels), [
    'none',
    'wording',
    'approach',
    'typescript',
    'edge-cases',
    'prerequisite',
    'integration',
  ])
  assert.equal(isDifficulty('prerequisite'), true)
  assert.equal(isDifficulty('toString'), false)
  assert.equal(isDifficulty(undefined), false)
  assert.deepEqual(
    Object.keys(stuckAdvice).sort(),
    Object.keys(difficultyLabels)
      .filter(kind => kind !== 'none')
      .sort(),
  )
})

test('stuck points group by kind and topic, count drafts as recent, and skip none, unknown, and completed drafts', () => {
  const summary = summarizeStuckPoints(
    [
      rec('sum-positive-numbers', 'edge-cases', 2),
      rec('count-even-numbers', 'edge-cases', 5),
      rec('has-duplicate', 'approach', 40),
      rec('count-words', 'none', 1),
      rec('missing-rep', 'approach', 1),
      rec('count-words', 'bogus', 1),
    ],
    {
      'most-frequent-number': { difficulty: 'prerequisite' },
      'first-long-word': { difficulty: 'wording', completedAt: ago(1) },
      'count-long-words': { difficulty: 'none' },
    },
    now,
  )
  assert.equal(summary.total, 4)
  assert.deepEqual(
    summary.kinds.map(group => [group.kind, group.total, group.recent]),
    [
      ['edge-cases', 2, 2],
      ['prerequisite', 1, 1],
      ['approach', 1, 0],
    ],
  )
  const prerequisite = summary.kinds.find(group => group.kind === 'prerequisite')
  assert.deepEqual(prerequisite.points, [{ repId: 'most-frequent-number', kind: 'prerequisite', inProgress: true }])
  const edge = summary.kinds[0]
  assert.deepEqual(
    edge.points.map(point => point.repId),
    ['sum-positive-numbers', 'count-even-numbers'],
    'newest first',
  )
  assert.ok(summary.focus, 'a focus is chosen when something is recent')
  assert.equal(summary.focus.recent, Math.max(...summary.topics.map(topic => topic.recent)))
  assert.ok(summary.topics.every(topic => topic.points.length === topic.total))
})

test('old stuck points never become the focus, and an empty history has no focus', () => {
  const old = summarizeStuckPoints([rec('has-duplicate', 'approach', 60)], {}, now)
  assert.equal(old.total, 1)
  assert.equal(old.focus, undefined)
  assert.deepEqual(summarizeStuckPoints([], {}, now), { total: 0, kinds: [], topics: [], focus: undefined })
})

test('the new difficulty values round-trip through a backup, and unknown values are still rejected', () => {
  const known = new Set(['sum-positive-numbers'])
  const attempt = { plan: 'p', code: 'c', explanation: 'e', hintCount: 0 }
  const backup = difficulty =>
    JSON.stringify({
      format: 'code-reps-backup',
      version: 1,
      exportedAt: '',
      learnerStart: null,
      history: [{ ...attempt, id: 'one', repId: 'sum-positive-numbers', completedAt: ago(1), difficulty }],
      drafts: { 'sum-positive-numbers': { ...attempt, difficulty } },
    })
  for (const difficulty of ['prerequisite', 'integration', 'edge-cases']) {
    const parsed = parseBackup(backup(difficulty), known)
    assert.equal(parsed.history[0].difficulty, difficulty)
    assert.equal(parsed.drafts['sum-positive-numbers'].difficulty, difficulty)
  }
  assert.throws(() => parseBackup(backup('stuck'), known), /invalid/)
})

test('every mistake tag has a habit, and its lessons are existing knowledge skills', () => {
  const skills = new Set(skillIndex.map(skill => skill.id))
  assert.deepEqual(Object.keys(mistakeHelp).sort(), mistakeTags.map(tag => tag.id).sort())
  for (const [tag, help] of Object.entries(mistakeHelp)) {
    assert.ok(help.habit.trim(), `${tag}: habit`)
    for (const lesson of help.lessons) assert.ok(skills.has(lesson), `${tag}: unknown lesson ${lesson}`)
  }
})
