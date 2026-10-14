import assert from 'node:assert/strict'
import test from 'node:test'
import { repIndex } from '../src/catalog-index.ts'
import { patternCards, patternTools, shuffledCards } from '../src/pattern-cards.ts'

test('every card is complete, offers three distinct known tools including its answer, and links a real rep', () => {
  const reps = new Set(repIndex.map(rep => rep.id))
  assert.equal(new Set(patternCards.map(card => card.id)).size, patternCards.length)
  assert.ok(patternCards.length >= 15)
  for (const card of patternCards) {
    assert.equal(new Set(card.choices).size, 3, `${card.id}: choices must differ`)
    assert.ok(card.choices.includes(card.answer), `${card.id}: answer must be offered`)
    for (const tool of card.choices) assert.ok(Object.hasOwn(patternTools, tool), `${card.id}: unknown tool ${tool}`)
    assert.ok(reps.has(card.repId), `${card.id}: unknown rep ${card.repId}`)
    for (const field of ['contract', 'signal', 'nearMiss']) assert.ok(card[field].trim().length > 20, `${card.id}: ${field}`)
  }
})

test('cards never name their answer in the contract, and answers are spread across positions and tools', () => {
  for (const card of patternCards) {
    const label = patternTools[card.answer].toLowerCase()
    assert.ok(!card.contract.toLowerCase().includes(label), `${card.id}: the contract names the answer`)
  }
  const positions = new Set(patternCards.map(card => card.choices.indexOf(card.answer)))
  assert.deepEqual([...positions].sort(), [0, 1, 2])
  assert.ok(new Set(patternCards.map(card => card.answer)).size >= 10)
})

test('shuffling keeps every card exactly once', () => {
  let seed = 1
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  const shuffled = shuffledCards(random)
  assert.equal(shuffled.length, patternCards.length)
  assert.deepEqual(shuffled.map(card => card.id).sort(), patternCards.map(card => card.id).sort())
})
