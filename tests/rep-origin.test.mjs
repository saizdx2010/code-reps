import assert from 'node:assert/strict'
import { test } from 'node:test'
import { catalogTopic } from '../src/catalog-labels.ts'
import { repIndex, skillIndex } from '../src/catalog-index.ts'
import { paths } from '../src/path.ts'
import { repContext } from '../src/rep-context.ts'
import { backLabel, decodeRepOrigin, encodeRepOrigin, originFrom } from '../src/rep-origin.ts'

const foundations = paths.find(path => path.id === 'typescript')
const trailIds = [...new Set(foundations.stages.flatMap(stage => stage.repIds))]
const lesson = skillIndex.find(skill => skill.repIds.length > 2)

test('an origin round-trips for its own rep and falls back to the Library for any other', () => {
  const id = trailIds[2]
  for (const origin of [
    { kind: 'view', view: 'home' },
    { kind: 'lesson', skillId: lesson.id },
  ]) {
    assert.deepEqual(decodeRepOrigin(encodeRepOrigin(id, origin), id), origin)
  }
  assert.deepEqual(decodeRepOrigin(encodeRepOrigin(id, { kind: 'view', view: 'home' }), trailIds[3]), { kind: 'view', view: 'catalog' })
  assert.deepEqual(decodeRepOrigin('', id), { kind: 'view', view: 'catalog' })
  // The value saved before origins named pages: `<rep>:<lesson>` still means that lesson.
  assert.deepEqual(decodeRepOrigin(`${id}:${lesson.id}`, id), { kind: 'lesson', skillId: lesson.id })
  // A retired lesson or an unknown page never strands the back link.
  assert.deepEqual(decodeRepOrigin(`${id}:lesson:no-such-lesson`, id), { kind: 'view', view: 'catalog' })
  assert.deepEqual(decodeRepOrigin(`${id}:view:workspace`, id), { kind: 'view', view: 'catalog' })
})

test('pages fold into their section, and moving between reps keeps the first origin', () => {
  const current = { kind: 'view', view: 'home' }
  assert.deepEqual(originFrom('skillmap', undefined, current), { kind: 'view', view: 'progress' })
  assert.deepEqual(originFrom('mistakes', undefined, current), { kind: 'view', view: 'history' })
  assert.deepEqual(originFrom('knowledge', lesson.id, current), { kind: 'lesson', skillId: lesson.id })
  assert.deepEqual(originFrom('workspace', undefined, current), current)
  assert.equal(backLabel({ kind: 'view', view: 'home' }), 'Your trail')
  assert.equal(backLabel({ kind: 'view', view: 'progress' }), 'Skills')
  assert.equal(backLabel({ kind: 'lesson', skillId: lesson.id }), lesson.title)
})

test('the stepping list follows where the rep was opened', () => {
  const id = trailIds[2]
  assert.deepEqual(repContext({ kind: 'view', view: 'home' }, id, 'typescript'), { label: 'Foundations', repIds: trailIds })
  const fromLesson = repContext({ kind: 'lesson', skillId: lesson.id }, lesson.repIds[1], 'typescript')
  assert.deepEqual(fromLesson, { label: lesson.title, repIds: [...lesson.repIds] })
  // From the Library, the rep's topic in the Library's own order: easiest first.
  const fromLibrary = repContext({ kind: 'view', view: 'catalog' }, id, 'typescript')
  const rep = repIndex.find(item => item.id === id)
  assert.equal(fromLibrary.label, catalogTopic(rep))
  assert.ok(fromLibrary.repIds.includes(id))
  assert.ok(fromLibrary.repIds.every(other => catalogTopic(repIndex.find(item => item.id === other)) === fromLibrary.label))
  // A rep outside the goal track steps through the first track that holds it.
  const other = paths.find(path => path.id === 'sql')
  const sqlRep = other.stages[0].repIds[0]
  assert.equal(repContext({ kind: 'view', view: 'home' }, sqlRep, 'typescript').label, other.title)
})
