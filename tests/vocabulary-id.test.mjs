import assert from 'node:assert/strict'
import test from 'node:test'
import { reps } from '../src/rep.ts'
import { indonesianGlossary, indonesianMeaning } from '../src/vocabulary-id.ts'

const terms = new Set(reps.flatMap(rep => rep.vocabulary.map(entry => entry.term)))

test('every rep vocabulary term has an Indonesian gloss', () => {
  const missing = [...terms].filter(term => !indonesianMeaning(term)?.trim())
  assert.deepEqual(missing, [])
})

test('the glossary has no unused keys', () => {
  const unused = Object.keys(indonesianGlossary).filter(term => !terms.has(term))
  assert.deepEqual(unused, [])
})
