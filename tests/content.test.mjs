import { asyncSolutions } from './fixtures/async-solutions.mjs'
import { practicalSolutions } from './fixtures/practical-solutions.mjs'
import { validateContentDepth } from '../src/content-depth.ts'
import { repDepth } from '../src/rep-depth.ts'
import { lessonDepth } from '../src/lesson-depth.ts'
import { skills } from '../src/knowledge.ts'
import { capstoneSolutions } from './fixtures/capstone-solutions.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { fluencySolutions } from '../src/fluency-reps.ts'
import { reps } from '../src/rep.ts'
import { aiEraReps } from '../src/ai-era-reps.ts'
import { runRep } from '../src/runner.ts'
import { reflectionGuides } from '../src/learning.ts'
import { richSolutions } from './fixtures/rich-solutions.mjs'
import { validationSolutions } from './fixtures/validation-solutions.mjs'

// These independent implementations check authored expected results, not learner prose.
const solutions = {
  ...validationSolutions,
  ...asyncSolutions,
  ...practicalSolutions,
  ...fluencySolutions,
  'declare-variables': 'function makeGreeting(name: string) { const greeting = "Hello, "; let message = greeting + name; return message }',
  'basic-types': 'function describePerson(name: string, age: number, active: boolean) { return `${name} is ${age}. Active: ${active}` }',
  'create-objects': 'type Person = {name: string; age: number}; function introduce(name: string, age: number) { const person: Person = {name, age}; return `${person.name} is ${person.age} years old` }',
  'make-arrays': 'function firstName(names: string[]) { return names.length ? names[0] : null }',
  'write-functions': 'function totalPrice(price: number, quantity: number) { return price * quantity }',
  'most-frequent-number': 'function mostFrequent(numbers: number[]) { if (!numbers.length) return null; const counts = new Map<number, number>(); for (const n of numbers) counts.set(n, (counts.get(n) ?? 0) + 1); return [...counts.keys()].sort((a,b) => counts.get(b)! - counts.get(a)! || a - b)[0] }',
  'first-unique-character': 'function firstUnique(text: string) { for (let i = 0; i < text.length; i++) if (text.indexOf(text[i]) === text.lastIndexOf(text[i])) return i; return -1 }',
  'balanced-brackets': 'function isBalanced(text: string) { const stack: string[] = []; const pairs: Record<string,string> = { ")": "(", "]": "[", "}": "{" }; for (const c of text) { if ("([{".includes(c)) stack.push(c); else if (stack.pop() !== pairs[c]) return false } return stack.length === 0 }',
  'sum-positive-numbers': 'function sumPositive(numbers: number[]) { return numbers.reduce((sum,n) => sum + (n > 0 ? n : 0), 0) }',
  'count-even-numbers': 'function countEvens(numbers: number[]) { return numbers.filter(n => n % 2 === 0).length }',
  'count-above-threshold': 'function countAbove(numbers: number[], limit: number) { return numbers.filter(n => n > limit).length }',
  'first-long-word': 'function firstLongWord(words: string[], minimum: number) { return words.find(w => w.length >= minimum) ?? null }',
  'count-words': 'function countWords(text: string) { return text.match(/\\S+/g)?.length ?? 0 }',
  'has-duplicate': 'function hasDuplicate(numbers: number[]) { return new Set(numbers).size !== numbers.length }',
  'missing-number': 'function missingNumber(numbers: number[]) { const n = numbers.length; return n * (n + 1) / 2 - numbers.reduce((sum,x) => sum + x, 0) }',
  'valid-parentheses': 'function validParentheses(text: string) { let open = 0; for (const c of text) { open += c === "(" ? 1 : -1; if (open < 0) return false } return open === 0 }',
  'count-long-words': 'function countLongWords(words: string[], minimum: number) { return words.filter(w => w.length >= minimum).length }',
  'first-repeated-number': 'function firstRepeated(numbers: number[]) { const seen = new Set<number>(); for (const n of numbers) { if (seen.has(n)) return n; seen.add(n) } return null }',
  'remove-adjacent-pairs': 'function removePairs(text: string) { const stack: string[] = []; for (const c of text) { if (stack.at(-1) === c) stack.pop(); else stack.push(c) } return stack.join("") }',
  'repair-visible-count': 'function countVisible(items: {active: boolean}[]) { return items.filter(item => item.active).length }',
  'read-unique-names': 'function uniqueNames(input: string[]) { return [...new Set(input.filter(name => name !== ""))] }',
  'transform-active-labels': 'function activeLabels(users: {name: string; active: boolean}[]) { return users.filter(user => user.active).map(user => user.name.trim()).filter(Boolean).map(name => name.toUpperCase()) }',
}

test('every rep has reference-solution coverage and a complete learning brief', () => {
  const covered = new Set([...Object.keys(solutions), ...Object.keys(richSolutions), ...Object.keys(capstoneSolutions), ...aiEraReps.map(rep => rep.id)])
  assert.equal(new Set(reps.map(rep => rep.id)).size, reps.length, 'Rep IDs must be unique')
  assert.deepEqual([...covered].sort(), reps.map(rep => rep.id).sort())
  for (const rep of reps) {
    assert.ok(reflectionGuides[rep.id]?.plan.length && reflectionGuides[rep.id]?.explanation.length && reflectionGuides[rep.id]?.example, `${rep.id}: missing authored self-review`)
    for (const field of ['title', 'category', 'prompt', 'note', 'planPrompt', 'starter', 'functionName']) {
      assert.ok(rep[field].trim(), `${rep.id}: missing ${field}`)
    }
    assert.ok(rep.example.input && rep.example.output, `${rep.id}: missing example`)
    assert.ok(rep.vocabulary.length && rep.hints.length >= 3 && rep.checks.length >= 3, `${rep.id}: incomplete support`)
    assert.equal(new Set(rep.checks.map(check => check.name)).size, rep.checks.length, `${rep.id}: duplicate check names`)
  }
})

for (const [id, code] of Object.entries(solutions)) {
  test(`authored checks accept the reference solution: ${id}`, () => {
    const failures = runRep(code, id).filter(result => !result.passed)
    assert.deepEqual(failures, [])
  })
}

test('authored checks reject omitted normalization and paging boundaries', () => {
  const incorrectSolutions = {
    'first-label-ending': 'function firstEnding(labels:string[], ending:string) { return labels.find(label => label.trim().toLowerCase().endsWith(ending)) ?? null }',
    'remaining-actions': 'function remainingActions(actions:string[]) { const result:string[] = []; for (const action of actions) { if (action.toUpperCase() === "UNDO") result.pop(); else result.push(action) } return result }',
    'validate-page-query': 'function validatePaging(input:unknown) { if (!input || typeof input !== "object" || Array.isArray(input)) return null; const x = input as Record<string,unknown>; if (typeof x.page !== "number" || !Number.isInteger(x.page) || x.page < 1 || typeof x.size !== "number" || x.size > 50) return null; return {page:x.page,size:x.size} }',
  }
  for (const [id, code] of Object.entries(incorrectSolutions)) {
    assert.ok(runRep(code, id).some(result => !result.passed), `${id}: accepted a known contract violation`)
  }
})

test('behavioral success does not hide prohibited input mutation', () => {
  const code = 'function activeLabels(users: {name: string; active: boolean}[]) { for (const user of users) user.name = user.name.trim(); return users.filter(user => user.active && user.name).map(user => user.name.toUpperCase()) }'
  const failures = runRep(code, 'transform-active-labels').filter(result => !result.passed)
  assert.ok(failures.some(result => result.message.includes('changed its input')))
  const sorting = 'function taskTitles(tasks: {title: string; done: boolean; priority: number}[]) { tasks.sort((a,b) => b.priority - a.priority); return tasks.filter(task => !task.done).map(task => task.title) }'
  assert.ok(runRep(sorting, 'interview-frontend').some(result => result.message?.includes('changed its input')))
})

test('running a mutating attempt does not corrupt authored inputs', () => {
  runRep('function pageIds(ids: string[], page: number, size: number) { ids.splice(0, ids.length); return ids }', 'backend-page-results')
  const code = 'function pageIds(ids: string[], page: number, size: number) { page = Math.max(1,page); size = Math.min(3,Math.max(1,size)); return ids.slice((page-1)*size, page*size) }'
  assert.ok(runRep(code, 'backend-page-results').every(result => result.passed))
})


test('every rep and lesson meets the content depth standard', () => {
  const repIds = new Set(reps.map(rep => rep.id))
  const skillIds = new Set(skills.map(skill => skill.id))
  assert.deepEqual(validateContentDepth(repIds, skillIds), [])
  const incomplete = { ...repDepth, 'sum-positive-numbers': { ...repDepth['sum-positive-numbers'], trace: '  ' } }
  assert.ok(validateContentDepth(repIds, skillIds, incomplete).includes('sum-positive-numbers: missing rep review trace'))
  const missingLesson = { ...lessonDepth }
  delete missingLesson.async
  assert.ok(validateContentDepth(repIds, skillIds, repDepth, missingLesson).includes('async: missing lesson depth challenge'))
  assert.ok(validateContentDepth(repIds, skillIds, { ...repDepth, orphan: repDepth['sum-positive-numbers'] }).includes('orphan: unknown rep review target'))
})
