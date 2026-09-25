import assert from 'node:assert/strict'
import test from 'node:test'
import { runRep } from '../src/runner.ts'

test('runs TypeScript 6 checks and shows input on failure', () => {
  const starter = 'function countVisible(items: { active: boolean }[]): number { return 0 }'
  const failed = runRep(starter, 'repair-visible-count')
  assert.equal(failed.some((result) => !result.passed), true)
  assert.match(failed.find((result) => !result.passed).input, /countVisible\(/)
  const fixed = 'function countVisible(items: { active: boolean }[]): number { return items.filter((item) => item.active).length }'
  assert.equal(runRep(fixed, 'repair-visible-count').every((result) => result.passed), true)
})

test('checks transformed array values by structure', () => {
  const code = 'function activeLabels(users: { name: string; active: boolean }[]): string[] { return users.filter((user) => user.active).map((user) => user.name.trim()).filter(Boolean).map((name) => name.toUpperCase()) }'
  assert.equal(runRep(code, 'transform-active-labels').every((result) => result.passed), true)
})

test('runs a foundation rep with a local type alias', () => {
  const code = 'type Person = { name: string; age: number }; function introduce(name: string, age: number): string { const person: Person = { name, age }; return `${person.name} is ${person.age} years old` }'
  assert.equal(runRep(code, 'create-objects').every((result) => result.passed), true)
})
