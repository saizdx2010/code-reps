import { connectedSolutionsById } from './fixtures/connected-feature-solutions.mjs'
import { browserStateSolutions } from './fixtures/browser-state-solutions.mjs'
import { dsaSolutions } from './fixtures/dsa-solutions.mjs'
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
import { reflectionGuides } from '../src/reflection-guides.ts'
import { richSolutions } from './fixtures/rich-solutions.mjs'
import { validationSolutions } from './fixtures/validation-solutions.mjs'
import { appSolutions } from './fixtures/app-solutions.mjs'
import { domSolutions } from './fixtures/dom-solutions.mjs'

// These independent implementations check authored expected results, not learner prose.
const solutions = {
  ...browserStateSolutions,
  ...validationSolutions,
  ...appSolutions,
  ...dsaSolutions,
  ...asyncSolutions,
  ...practicalSolutions,
  ...fluencySolutions,
  'declare-variables': 'function makeGreeting(name: string) { const greeting = "Hello, "; let message = greeting + name; return message }',
  'basic-types': 'function describePerson(name: string, age: number, active: boolean) { return `${name} is ${age}. Active: ${active}` }',
  'create-objects': 'type Person = {name: string; age: number}; function introduce(name: string, age: number) { const person: Person = {name, age}; return `${person.name} is ${person.age} years old` }',
  'make-arrays': 'function firstName(names: string[]) { return names.length ? names[0] : null }',
  'write-functions': 'function totalPrice(price: number, quantity: number) { return price * quantity }',
  'use-conditions': "function gradeLabel(score: number) { if (score < 0 || score > 100) return 'Invalid'; if (score >= 90) return 'A'; if (score >= 80) return 'B'; if (score >= 70) return 'C'; if (score >= 60) return 'D'; return 'F' }",
  'loop-with-for': 'function sumUpTo(n: number) { let total = 0; for (let i = 1; i <= n; i++) total += i; return total }',
  'loop-while': 'function stepsToOne(n: number) { let value = n; let steps = 0; while (value > 1) { value = Math.floor(value / 2); steps++ } return steps }',
  'string-basics': 'function initials(fullName: string) { return fullName.trim().split(/\\s+/).map(word => word.slice(0, 1).toUpperCase()).join("") }',
  'object-update': 'type Task = { title: string; done: boolean; priority: number }; function setDone(task: Task, done: boolean) { return { ...task, done } }',
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
  'shipping-cost-tiers': 'function shippingCost(lines: {weightGrams: number; quantity: number}[]) { if (lines.length === 0) return 0; let total = 0; let bulky = false; for (const line of lines) { total += line.weightGrams * line.quantity; if (line.quantity > 10) bulky = true } let cost = total <= 500 ? 300 : total <= 2000 ? 600 : 1200; if (bulky) cost += 200; return cost }',
  'countdown-labels': 'function countdownLabels(startSeconds: number, stepSeconds: number) { const labels: string[] = []; for (let value = startSeconds; value >= 0; value -= stepSeconds) { const minutes = Math.floor(value / 60); const seconds = value % 60; labels.push(`${minutes}:${String(seconds).padStart(2, "0")}`) } return labels }',
}

test('every rep has reference-solution coverage and a complete learning brief', () => {
  const covered = new Set([...Object.keys(solutions), ...Object.keys(richSolutions), ...Object.keys(capstoneSolutions), ...Object.keys(domSolutions), ...Object.keys(connectedSolutionsById), ...aiEraReps.map(rep => rep.id)])
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

test('object-update rejects an in-place change even when the returned value is right', () => {
  const code = 'type Task = { title: string; done: boolean; priority: number }; function setDone(task: Task, done: boolean) { task.done = done; return task }'
  const failures = runRep(code, 'object-update').filter(result => !result.passed)
  assert.ok(failures.length > 0)
  assert.ok(failures.every(result => result.message?.includes('changed its input')))
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

test('control-flow journey reps reject boundary and padding mistakes', () => {
  const s = solutions
  const mutants = [
    ['shipping-cost-tiers', s['shipping-cost-tiers'].replace('total <= 500', 'total < 500')],
    ['shipping-cost-tiers', s['shipping-cost-tiers'].replace('line.quantity > 10', 'line.quantity >= 10')],
    ['shipping-cost-tiers', s['shipping-cost-tiers'].replace('if (lines.length === 0) return 0; ', '')],
    ['countdown-labels', s['countdown-labels'].replace('value >= 0', 'value > 0')],
    ['countdown-labels', s['countdown-labels'].replace('String(seconds).padStart(2, "0")', 'String(seconds)')],
    ['countdown-labels', s['countdown-labels'].replace('Math.floor(value / 60)', 'Math.round(value / 60)')],
  ]
  for (const [index, [id, code]] of mutants.entries()) assert.ok(runRep(code, id).some(result => !result.passed), `mutant ${index} of ${id} escaped the checks`)
})

test('DSA application checks reject changed order, deduplication, leaf rules, and route semantics', () => {
  const incorrect = {
    'ticket-service-times': 'function ticketTimes(tickets) { return tickets.map(t=>({id:t.id,start:t.arrival,finish:t.arrival+t.minutes})) }',
    'parcel-loading-turns': 'function loadingTurn(parcels,targetIndex) { return parcels.length*parcels[targetIndex] }',
    'sorted-offset-squares': 'function squareOffsets(offsets:number[]) { return offsets.map(n=>n*n) }',
    'reading-run-summary': 'function summarizeReadings(readings:number[]) { return [...new Set(readings)].map(value=>({value,count:1})) }',
    'sort-score-records': 'function orderRecords(records: {id:string;score:number;name:string}[]) { return [...records].sort((a,b)=>a.name.localeCompare(b.name)||a.score-b.score) }',
    'kth-smallest-copy': 'function kthSmallest(numbers:number[],k:number) { return [...new Set(numbers)].sort((a,b)=>a-b)[k-1] ?? null }',
    'count-unique-windows': 'function countUniqueWindows(labels:string[],k:number) { return labels.length>=k && new Set(labels).size===labels.length ? labels.length-k+1 : 0 }',
    'shortest-run-reaching-target': 'function shortestRun(numbers:number[],target:number) { let best=0; for(let i=0;i<numbers.length;i++) if(numbers[i]>=target) return 1; let total=numbers.reduce((a,b)=>a+b,0); return total>target?numbers.length:0 }',
    'first-insertion-point': 'function insertionPoint(numbers:number[],target:number) { return numbers.indexOf(target) }',
    'smallest-daily-capacity': 'function smallestCapacity(weights:number[],days:number) { return weights.length ? Math.max(...weights) : 0 }',
    'flatten-nested-numbers': 'function flattenNumbers(items:unknown[]) { return items.flat(10).filter(Boolean) }',
    'count-object-leaves': 'function countLeaves(input:Record<string,unknown>):number { return Object.values(input).reduce<number>((sum,value)=>sum+(value ? typeof value === "object" ? countLeaves(value as Record<string,unknown>) : 1 : 0),0) }',
    'tree-depth-sum': 'function sumAtDepth(root:{value:number;children:any[]}|null,depth:number):number { if(!root)return 0; if(!depth)return root.value; return Math.max(0,...root.children.map(child=>sumAtDepth(child,depth-1))) }',
    'tree-value-path': 'function pathToValue(root:{value:number;children:any[]}|null,target:number):number[]|null { if(!root)return null; if(root.value===target)return [target]; for(const child of root.children){const path=pathToValue(child,target);if(path)return path}return null }',
    'graph-shortest-hops': 'function shortestHops(graph:number[][],start:number,target:number) { if(start===target)return 0; return null }',
    'graph-connected-groups': 'function connectedGroups(graph:number[][]) { return graph.filter(neighbors=>neighbors.length===0).length }',
    'simplify-file-path': 'function simplifyPath(path:string) { return "/"+path.split("/").filter(part=>part && !part.startsWith(".")).join("/") }',
  }
  for (const [id, code] of Object.entries(incorrect)) {
    assert.ok(runRep(code, id).some(result => !result.passed), `${id}: incorrect contract passed`)
  }
})
