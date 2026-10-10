import test from 'node:test'
import assert from 'node:assert/strict'
import { plural, formatDate } from '../src/ui-copy.ts'
import { catalogTopic, formatLabels } from '../src/catalog-labels.ts'
import { reps } from '../src/rep.ts'

test('plural labels use the count of the named thing', () => {
  assert.equal(`1 ${plural(1, 'day')}`, '1 day')
  assert.equal(`0 ${plural(0, 'day')}`, '0 days')
  assert.equal(`2 ${plural(2, 'day')}`, '2 days')
  assert.equal(`1 of 1 ${plural(1, 'rep')}`, '1 of 1 rep')
  assert.equal(`1 of 2 ${plural(2, 'rep')}`, '1 of 2 reps')
})

test('Journal and Progress dates use readable local calendar dates', () => {
  const date = new Date(2026, 9, 10, 14, 30)
  assert.equal(formatDate(date.getTime()), date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }))
  assert.equal(formatDate(date.toISOString(), true), date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }))
})

test('catalog gives each rep one primary topic without overlapping array labels', () => {
  const topic = id => catalogTopic(reps.find(rep => rep.id === id))
  assert.equal(topic('sum-matching-prices'), 'Arrays')
  assert.equal(topic('first-long-word'), 'Arrays')
  assert.equal(topic('first-duplicate-label'), 'Maps and sets')
  assert.equal(topic('first-unique-character'), 'Maps and sets')
  assert.equal(topic('has-duplicate'), 'Maps and sets')
  assert.equal(topic('algo-insertion-sort'), topic('sort-score-records'))
  assert.equal(topic('valid-parentheses'), topic('remove-adjacent-pairs'))
  assert.equal(topic('repair-visible-count'), topic('debug-cart-total'))
  assert.equal(formatLabels.algorithm, 'Exercise')
  for (const rep of reps) assert.ok(catalogTopic(rep))
  assert.ok(!reps.map(catalogTopic).some(topic => /Arrays &|Algorithm (applications|techniques)/.test(topic)))
})

test('task limits stay in the brief and assessment sentences move without rewriting', async () => {
  const { repNotes } = await import('../src/rep-notes.ts')
  assert.deepEqual(repNotes('Numbers may be decimals. Return 0 for empty input.'), {
    brief: 'Numbers may be decimals. Return 0 for empty input.', checking: '',
  })
  assert.deepEqual(repNotes('Keep the starter name. Checks verify the greeting; review your use of const and let.'), {
    brief: 'Keep the starter name.', checking: 'Checks verify the greeting; review your use of const and let.',
  })
  assert.deepEqual(repNotes('Review your types yourself. No network or packages are available.'), {
    brief: 'No network or packages are available.', checking: 'Review your types yourself.',
  })
  // Every authored sentence stays available; none are discarded or reworded.
  for (const rep of reps) {
    const notes = repNotes(rep.note)
    const sentences = text => text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean).sort()
    assert.deepEqual(sentences(`${notes.brief} ${notes.checking}`.trim()), sentences(rep.note))
  }
})
