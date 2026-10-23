import assert from 'node:assert/strict'
import test from 'node:test'
import { paths } from '../src/path.ts'
import { repIndex } from '../src/catalog-index.ts'
import { latestCompletedCode, newlyLitPart, rewardProgress, stageReward, stageRewards } from '../src/toy-rewards.ts'

const record = (repId, completedAt, code = 'function f() {}', id = `${repId}-${completedAt}`) => ({
  id,
  repId,
  completedAt,
  code,
  plan: '',
  explanation: '',
  hintCount: 0,
})
const console = stageRewards.find(reward => reward.toyId === 'request-console')

test('every reward part is a rep on its own track, listed once', () => {
  for (const reward of stageRewards) {
    const track = paths.find(path => path.id === reward.trackId)
    assert.ok(track, reward.trackId)
    const onTrack = new Set(track.stages.flatMap(stage => stage.repIds))
    assert.equal(new Set(reward.parts.map(part => part.repId)).size, reward.parts.length)
    for (const part of reward.parts) {
      assert.ok(onTrack.has(part.repId), `${part.repId} is on ${reward.trackId}`)
      assert.ok(
        repIndex.some(rep => rep.id === part.repId),
        part.repId,
      )
    }
    assert.equal(reward.milestones.at(-1).parts, reward.parts.length, 'the last milestone needs every part')
  }
})

test('a part is lit by its latest completed attempt that saved code', () => {
  const history = [
    record('backend-split-target', '2026-10-01T10:00:00.000Z', 'old'),
    record('backend-split-target', '2026-10-05T10:00:00.000Z', 'new'),
    record('backend-split-target', '2026-10-09T10:00:00.000Z', '   '),
    record('backend-decode-query', 'not a date', 'broken date'),
  ]
  assert.equal(latestCompletedCode(history, 'backend-split-target'), 'new')
  assert.equal(latestCompletedCode(history, 'backend-decode-query'), null)
  assert.equal(latestCompletedCode(history, 'backend-request-line'), null)
})

test('the progress line counts lit parts and the reps until the next thing the toy can do', () => {
  const at = index => `2026-10-0${index + 1}T10:00:00.000Z`
  const lit = count => console.parts.slice(0, count).map((part, index) => record(part.repId, at(index)))
  assert.equal(rewardProgress(console, []).line, 'Request console: 0 of 8 parts lit. 5 reps until requests parse.')
  assert.equal(rewardProgress(console, lit(4)).line, 'Request console: 4 of 8 parts lit. 1 rep until requests parse.')
  assert.equal(rewardProgress(console, lit(5)).line, 'Request console: 5 of 8 parts lit. 3 reps until requests reach a handler.')
  assert.equal(rewardProgress(console, lit(8)).line, 'Request console: all 8 parts lit, so requests reach a handler.')
  // Parts lit out of order count, but the first milestone still needs all of its own parts.
  const routing = console.parts.slice(5).map((part, index) => record(part.repId, at(index)))
  assert.deepEqual(rewardProgress(console, routing).lit, 3)
  assert.equal(rewardProgress(console, routing).line, 'Request console: 3 of 8 parts lit. 5 reps until requests parse.')
})

test('only stages that hold a part show the reward', () => {
  const backend = paths.find(path => path.id === 'backend')
  const fed = backend.stages.filter(stage => stageReward('backend', stage.repIds)).map(stage => stage.title)
  assert.deepEqual(fed, ['What a request is', 'Route a request'])
  assert.equal(stageReward('sql', ['backend-split-target']), undefined)
})

test('a completion lights a part only the first time its rep is completed with code', () => {
  const first = record('backend-decode-query', '2026-10-02T10:00:00.000Z', 'code', 'first')
  const again = record('backend-decode-query', '2026-10-03T10:00:00.000Z', 'code', 'again')
  assert.equal(newlyLitPart([first], 'first').part.label, 'query decoding')
  assert.equal(newlyLitPart([first, again], 'again'), null)
  // An earlier completion without saved code never lit the part.
  assert.equal(newlyLitPart([{ ...first, code: '' }, again], 'again').part.id, 'query')
  assert.equal(newlyLitPart([record('two-sum', '2026-10-02T10:00:00.000Z', 'code', 'other')], 'other'), null)
  assert.equal(newlyLitPart([], 'missing'), null)
})
