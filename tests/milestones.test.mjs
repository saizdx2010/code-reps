import assert from 'node:assert/strict'
import test from 'node:test'
import { closeout, trackRepIds } from '../src/stage-closeout.ts'
import { finishedTracks, trackFinish, trackNotes, trackProgress } from '../src/track-finish.ts'
import { programFacts, reflectionBody, reflectionPrefix, repsPerWeek, starterProgram } from '../src/starter-program.ts'
import { returningSkipStages } from '../src/curriculum.ts'
import { paths } from '../src/path.ts'
import { buildTrail } from '../src/trail-map.ts'

const day = 86_400_000
const t0 = new Date(2026, 0, 5, 12).getTime()
const at = n => new Date(t0 + n * day).toISOString()
let serial = 0
const rec = (repId, n, hintCount = 0) => ({ id: `r${++serial}`, repId, completedAt: at(n), hintCount, plan: '', code: '', explanation: '' })
const foundations = paths.find(path => path.id === 'typescript')
const stage = title => foundations.stages.find(item => item.title === title)
const goal = { pathId: 'typescript', minutes: 20, days: [1, 3, 5] }
/** The goal trail as Home builds it, from completed reps and checked lessons. */
const trailStages = (history, { lessons = [], skipStages = 0 } = {}) =>
  buildTrail('typescript', {
    completed: id => history.some(record => record.repId === id),
    inProgress: () => false,
    recallReady: () => true,
    lessonChecked: id => lessons.includes(id),
    skipStages,
  }).stages

test('the attempt that finishes a goal-track stage closes it, with its skills, the reps it held, and the next stage', () => {
  const guided = rec('has-duplicate', 0, 2)
  const unique = rec('first-unique-character', 1)
  const last = rec('most-frequent-number', 2)
  const history = [guided, unique, last]
  assert.deepEqual(closeout(history, last.id, 'typescript'), {
    kind: 'stage',
    pathId: 'typescript',
    title: 'Count and remember',
    number: 4,
    repCount: 3,
    skills: [{ id: 'lookup', title: 'Count and remember', state: 'independent' }],
    pending: 0,
    next: { number: 5, title: 'Handle text and gaps', repId: 'count-words' },
  })
  // Earlier completions in the stage closed nothing: the stage was not finished yet.
  assert.equal(closeout(history, guided.id, 'typescript'), null)
  assert.equal(closeout(history, unique.id, 'typescript'), null)
  // Another goal track that does not hold the stage shows nothing, and an unknown record shows nothing.
  assert.equal(closeout(history, last.id, 'sql'), null)
  assert.equal(closeout(history, 'missing', 'typescript'), null)
})

test('a hinted finish closes the stage too, and reports the stage skill as still to make Independent', () => {
  const history = [rec('has-duplicate', 0, 1), rec('first-unique-character', 1, 1), rec('most-frequent-number', 2, 2)]
  const result = closeout(history, history[2].id, 'typescript')
  assert.equal(result.kind, 'stage')
  assert.deepEqual(result.skills, [])
  assert.equal(result.pending, 1)
})

test('only the first completion of the last rep closes a stage; a repeat or a later record never does', () => {
  const ids = stage('Learn the language').repIds
  const history = ids.map((id, index) => rec(id, index))
  const finishing = history.at(-1)
  assert.equal(closeout(history, finishing.id, 'typescript').title, 'Learn the language')
  const again = rec(finishing.repId, 10)
  assert.equal(closeout([...history, again], again.id, 'typescript'), null)
  // A record dated after the finish does not count toward the earlier completion.
  const early = rec('write-functions', -1)
  const reordered = [...history.slice(0, -1), early]
  assert.equal(closeout(reordered, early.id, 'typescript'), null)
})

test('the next stage starts at its first rep not yet completed, and returning learners count stages from where they start', () => {
  const next = stage('Make decisions and repeat').repIds
  const history = [
    ...stage('Learn the language')
      .repIds.slice(0, -1)
      .map((id, index) => rec(id, index)),
    rec(next[0], 5),
  ]
  const last = rec('write-functions', 6)
  const result = closeout([...history, last], last.id, 'typescript')
  assert.deepEqual(result.next, { number: 2, title: 'Make decisions and repeat', repId: next[1] })
  const skip = returningSkipStages('typescript')
  assert.ok(skip >= 1)
  const returning = closeout([...history, last], last.id, 'typescript', skip)
  assert.equal(returning.number, undefined)
})

test('finishing every rep in a track closes the track instead of its stage', () => {
  const ids = trackRepIds(foundations)
  const history = ids.map((id, index) => rec(id, index))
  const last = history.at(-1)
  assert.deepEqual(closeout(history, last.id, 'typescript'), {
    kind: 'track',
    pathId: 'typescript',
    title: 'Foundations',
    repCount: ids.length,
  })
  // The track is closed whatever the goal; Foundations is the only track these reps finish.
  assert.equal(closeout(history, last.id, 'sql').pathId, 'typescript')
})

test('a finished track reports its dates, days taken, first and last reps, and skill evidence; unfinished tracks are null', () => {
  const ids = trackRepIds(foundations)
  const history = ids.map((id, index) => rec(id, Math.floor(index / 4)))
  history.push(rec(ids[0], 30))
  const finish = trackFinish('typescript', history, t0 + 60 * day)
  assert.equal(finish.first.repId, ids[0])
  assert.equal(finish.first.id, history[0].id)
  assert.equal(finish.last.repId, ids.at(-1))
  assert.equal(finish.repCount, ids.length)
  assert.equal(finish.days, Math.floor((ids.length - 1) / 4) + 1)
  // Practice days count the days between the first completion and the finish; the later repeat is outside.
  assert.equal(finish.practiceDays, finish.days)
  assert.ok(finish.skills.length > 0)
  assert.ok(finish.skills.every(skill => skill.state === 'independent' || skill.state === 'retained'))
  assert.ok(finish.skillTotal >= finish.skills.length)
  assert.deepEqual(trackProgress('typescript', history), { done: ids.length, total: ids.length })
  assert.deepEqual(
    finishedTracks(history, t0 + 60 * day).map(item => item.pathId),
    ['typescript'],
  )
  const missing = history.filter(record => record.repId !== ids[3])
  assert.equal(trackFinish('typescript', missing, t0 + 60 * day), null)
  assert.deepEqual(trackProgress('typescript', missing), { done: ids.length - 1, total: ids.length })
  assert.equal(trackFinish('no-such-track', history), null)
  // A completion dated in the future does not finish anything yet.
  assert.equal(trackFinish('typescript', history, t0 + day), null)
})

test('track notes are the ones about its reps or about lessons its reps practice', () => {
  const note = (id, skillId, repId) => ({ id, title: id, body: '', skillId, repId, kind: 'note', updatedAt: at(0) })
  const notes = [
    note('lesson', 'lookup', ''),
    note('rep', '', 'most-frequent-number'),
    note('other', 'sql-joins', ''),
    note('free', '', ''),
  ]
  assert.deepEqual(
    trackNotes('typescript', notes).map(item => item.id),
    ['lesson', 'rep'],
  )
  assert.deepEqual(trackNotes('missing', notes), [])
})

test('the first four weeks take the goal track in trail order, a few new reps a week with their lessons', () => {
  const program = starterProgram({ history: [], goal, stages: trailStages([]), notes: [], now: t0 })
  assert.equal(program.started, false)
  assert.equal(program.week, 1)
  assert.equal(program.perWeek, 3)
  assert.equal(program.startAt, new Date(2026, 0, 5).getTime())
  const reps = program.weeks.map(week => week.items.filter(item => item.kind === 'rep').map(item => item.id))
  assert.deepEqual(reps[0], ['declare-variables', 'basic-types', 'create-objects'])
  assert.ok(reps.every(week => week.length === 3))
  assert.deepEqual(
    program.weeks[0].items.map(item => `${item.kind}:${item.id}`),
    ['lesson:values', 'rep:declare-variables', 'rep:basic-types', 'rep:create-objects'],
  )
  // Recall reps are left to the reviews they become; the trail order is otherwise kept.
  const trail = buildTrail('typescript', {
    completed: () => false,
    inProgress: () => false,
    recallReady: () => true,
    lessonChecked: () => false,
  })
  const order = trail.stages.flatMap(stage => stage.nodes).filter(node => node.kind === 'rep' && node.role !== 'Recall')
  assert.deepEqual(
    reps.flat(),
    order.slice(0, 12).map(node => node.repId),
  )
  assert.equal(program.onTrail, true)
})

test('weeks start at the first completed attempt and count done targets; the plan sets how many reps a week', () => {
  const history = [rec('declare-variables', 0), rec('basic-types', 8, 2)]
  const program = starterProgram({ history, goal, stages: trailStages(history, { lessons: ['values'] }), notes: [], now: t0 + 9 * day })
  assert.equal(program.started, true)
  assert.equal(program.week, 2)
  assert.equal(program.weeks[0].done, 3)
  assert.equal(program.done, 3)
  assert.equal(program.weeks[1].startsAt, new Date(2026, 0, 12).getTime())
  assert.equal(repsPerWeek({ ...goal, days: [] }), 3)
  assert.equal(repsPerWeek({ ...goal, minutes: 45, days: [1, 2, 3, 4, 5] }), 6)
  assert.equal(repsPerWeek({ ...goal, minutes: 10, days: [6] }), 2)
  const skipStages = returningSkipStages('typescript')
  const returning = starterProgram({ history: [], goal, stages: trailStages([], { skipStages }), notes: [], now: t0 })
  const skipped = foundations.stages.slice(0, skipStages).flatMap(stage => stage.repIds)
  assert.ok(skipped.length > 0)
  assert.ok(returning.weeks.flatMap(week => week.items).every(item => !skipped.includes(item.id)))
})

test('after week four the program is finished; Trail keeps it a week unless the reflection is saved first', () => {
  const history = [rec('declare-variables', 0)]
  const input = { history, goal, stages: trailStages(history), notes: [] }
  const last = starterProgram({ ...input, now: t0 + 27 * day })
  assert.equal(last.week, 4)
  assert.equal(last.finished, false)
  const finished = starterProgram({ ...input, now: t0 + 28 * day })
  assert.equal(finished.week, 5)
  assert.equal(finished.finished, true)
  assert.equal(finished.onTrail, true)
  assert.equal(starterProgram({ ...input, now: t0 + 35 * day }).onTrail, false)
  const note = {
    id: `${reflectionPrefix}x`,
    title: 'Your first 4 weeks',
    body: '',
    skillId: '',
    repId: '',
    kind: 'note',
    updatedAt: at(28),
  }
  const reflected = starterProgram({ ...input, notes: [note], now: t0 + 29 * day })
  assert.equal(reflected.reflection, note)
  assert.equal(reflected.onTrail, false)
})

test('the reflection note keeps the facts and only the answered questions', () => {
  const history = [rec('declare-variables', 0), rec('basic-types', 1, 1), rec('declare-variables', 40)]
  const program = starterProgram({ history, goal, stages: trailStages(history), notes: [], now: t0 + 30 * day })
  const facts = programFacts(program, history)
  // Twelve reps and the three lessons the trail places before them; the attempt after week four is not counted.
  assert.equal(program.total, 15)
  assert.match(facts, /^Your first 4 weeks, from .+ to .+: 2 of 15 targets done; 2 completed attempts on 2 days, 1 without hints\.$/)
  const body = reflectionBody(program, history, ['Loops make sense now.', '  ', 'Arrays next.'])
  assert.equal(
    body,
    `${facts}\n\nWhat can you do now that you could not do four weeks ago?\nLoops make sense now.\n\nWhat will you practice next?\nArrays next.`,
  )
})
