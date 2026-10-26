import assert from 'node:assert/strict'
import { test } from 'node:test'
import { emptyFluency, parseFluency } from '../src/fluency.ts'
import { unclearNote, unclearNotesFor } from '../src/unclear-notes.ts'

const base = { id: 'abc', repId: 'count-words', repTitle: 'Count words', skillId: '', now: Date.UTC(2026, 10, 1, 9) }

test('an unclear flag needs a part or some words, and becomes an ordinary Notebook question', () => {
  assert.equal(unclearNote({ ...base, parts: [], detail: '   ' }), undefined)
  const note = unclearNote({ ...base, parts: ['A hint', 'The example'], detail: '  Is a tab a separator?  ' })
  assert.deepEqual(note, {
    id: 'unclear-abc',
    title: 'Unclear: Count words',
    // Parts keep the catalog order, whatever order they were chosen in.
    body: 'Unclear part: The example, A hint.\n\nIs a tab a separator?',
    skillId: '',
    repId: 'count-words',
    kind: 'question',
    updatedAt: '2026-11-01T09:00:00.000Z',
  })
  assert.equal(unclearNote({ ...base, parts: ['A word'], detail: '' })?.body, 'Unclear part: A word.')
  // The saved learning data accepts it, so backups and merging carry it like any other entry.
  assert.deepEqual(parseFluency({ ...emptyFluency(), notes: [note] }).notes, [note])
})

test('long titles and ids stay within the Notebook limits', () => {
  const note = unclearNote({ ...base, id: 'x'.repeat(100), repTitle: 'T'.repeat(200), parts: [], detail: 'd'.repeat(3000) })
  assert.equal(note?.id.length, 80)
  assert.equal(note?.title.length, 120)
  assert.equal(note?.body.length, 2000)
  assert.doesNotThrow(() => parseFluency({ ...emptyFluency(), notes: [note] }))
})

test("a rep's flags are its own unclear notes, newest first", () => {
  const at = (id, repId, day) => ({ ...unclearNote({ ...base, id, repId, parts: ['A hint'], detail: '', now: Date.UTC(2026, 10, day) }) })
  const plain = {
    id: 'n1',
    title: 'Note',
    body: '',
    skillId: '',
    repId: 'count-words',
    kind: 'note',
    updatedAt: '2026-11-05T00:00:00.000Z',
  }
  const notes = [at('a', 'count-words', 1), plain, at('b', 'has-duplicate', 2), at('c', 'count-words', 3)]
  assert.deepEqual(
    unclearNotesFor(notes, 'count-words').map(note => note.id),
    ['unclear-c', 'unclear-a'],
  )
})
