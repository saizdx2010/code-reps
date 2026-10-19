import { reactSolutions } from './fixtures/react-solution.mjs'
import { sqliteSolution, sqliteCustomerTotalsSolution, sqliteRestockSolution } from './fixtures/sqlite-solution.mjs'
import { sqlSolutions } from './fixtures/sql-solutions.mjs'
import { backendSolutions } from './fixtures/backend-solutions.mjs'
import { devopsSolutions } from './fixtures/devops-solutions.mjs'
import initSqlJs from 'sql.js'
import { typescriptDepthSolutions } from './fixtures/typescript-depth-solutions.mjs'
import { recallThinSolutions } from './fixtures/recall-thin-solutions.mjs'
import { journeyPracticeSolutions } from './fixtures/journey-practice-solutions.mjs'
import { connectedSolutionsById } from './fixtures/connected-feature-solutions.mjs'
import { browserStateSolutions } from './fixtures/browser-state-solutions.mjs'
import { dsaSolutions } from './fixtures/dsa-solutions.mjs'
import { foundationsSolutions } from './fixtures/foundations-solutions.mjs'
import { coreSolutions } from './fixtures/core-solutions.mjs'
import { asyncSolutions } from './fixtures/async-solutions.mjs'
import { practicalSolutions } from './fixtures/practical-solutions.mjs'
import { expansionSolutions } from './fixtures/expansion-solutions.mjs'
import { validateContentDepth } from '../src/content-depth.ts'
import { validateReps } from '../src/rep-validation.ts'
import { repDepth } from '../src/rep-depth.ts'
import { lessonDepth } from '../src/lesson-depth.ts'
import { skills } from '../src/knowledge.ts'
import { capstoneSolutions } from './fixtures/capstone-solutions.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { fluencySolutions } from './fixtures/fluency-solutions.mjs'
import { reps } from '../src/rep.ts'
import { aiEraReps } from '../src/ai-era-reps.ts'
import { runRep, runAsyncRep } from '../src/runner.ts'
import { reflectionGuides } from '../src/reflection-guides.ts'
import { richSolutions } from './fixtures/rich-solutions.mjs'
import { validationSolutions } from './fixtures/validation-solutions.mjs'
import { appSolutions } from './fixtures/app-solutions.mjs'
import { domSolutions } from './fixtures/dom-solutions.mjs'
import { testingJourneySolutions } from './fixtures/testing-journey-solutions.mjs'
import { maintenanceSolutions } from './fixtures/maintenance-journey-solutions.mjs'
import { assertMutantsFail } from './helpers/checks.mjs'

// These independent implementations check authored expected results, not learner prose.
const SQL = await initSqlJs()
const solutions = {
  'sqlite-stock-transfer': sqliteSolution,
  'sqlite-customer-totals': sqliteCustomerTotalsSolution,
  'sqlite-restock-upsert': sqliteRestockSolution,
  ...sqlSolutions,
  ...backendSolutions,
  ...devopsSolutions,
  ...typescriptDepthSolutions,
  ...recallThinSolutions,
  ...journeyPracticeSolutions,
  ...browserStateSolutions,
  ...validationSolutions,
  ...appSolutions,
  ...dsaSolutions,
  ...foundationsSolutions,
  ...asyncSolutions,
  ...practicalSolutions,
  ...fluencySolutions,
  ...testingJourneySolutions,
  ...maintenanceSolutions,
  ...coreSolutions,
  ...expansionSolutions,
}

test('every rep has reference-solution coverage and a complete learning brief', () => {
  const covered = new Set([
    ...Object.keys(solutions),
    ...Object.keys(richSolutions),
    ...Object.keys(capstoneSolutions),
    ...Object.keys(domSolutions),
    ...Object.keys(connectedSolutionsById),
    ...aiEraReps.map(rep => rep.id),
    ...Object.keys(reactSolutions),
  ])
  assert.deepEqual([...covered].sort(), reps.map(rep => rep.id).sort())
  assert.deepEqual(validateReps(reps, reflectionGuides), [])
})

test('the shared rep validator names each incomplete authoring field', () => {
  const [rep] = reps
  const broken = {
    ...rep,
    note: ' ',
    example: { input: '', output: '' },
    hints: rep.hints.slice(0, 2),
    checks: [rep.checks[0], rep.checks[0]],
  }
  assert.deepEqual(validateReps([broken, broken], {}), [
    'Exercise IDs must be unique.',
    ...[1, 2].flatMap(() => [
      `${rep.id}: missing note`,
      `${rep.id}: missing example`,
      `${rep.id}: missing or duplicate checks`,
      `${rep.id}: incomplete support (needs vocabulary, three hints, and three checks)`,
      `${rep.id}: missing self-review`,
    ]),
  ])
})

for (const [id, code] of Object.entries(solutions)) {
  test(`authored checks accept the reference solution: ${id}`, async () => {
    const failures = (await runAsyncRep(code, id, () => new SQL.Database())).filter(result => !result.passed)
    assert.deepEqual(failures, [])
  })
}

test('authored checks reject omitted normalization and paging boundaries', () => {
  const incorrectSolutions = {
    'first-label-ending':
      'function firstEnding(labels:string[], ending:string) { return labels.find(label => label.trim().toLowerCase().endsWith(ending)) ?? null }',
    'remaining-actions':
      'function remainingActions(actions:string[]) { const result:string[] = []; for (const action of actions) { if (action.toUpperCase() === "UNDO") result.pop(); else result.push(action) } return result }',
    'validate-page-query':
      'function validatePaging(input:unknown) { if (!input || typeof input !== "object" || Array.isArray(input)) return null; const x = input as Record<string,unknown>; if (typeof x.page !== "number" || !Number.isInteger(x.page) || x.page < 1 || typeof x.size !== "number" || x.size > 50) return null; return {page:x.page,size:x.size} }',
  }
  assertMutantsFail(Object.entries(incorrectSolutions))
})

test('behavioral success does not hide prohibited input mutation', () => {
  const code =
    'function activeLabels(users: {name: string; active: boolean}[]) { for (const user of users) user.name = user.name.trim(); return users.filter(user => user.active && user.name).map(user => user.name.toUpperCase()) }'
  const failures = runRep(code, 'transform-active-labels').filter(result => !result.passed)
  assert.ok(failures.some(result => result.message.includes('changed its input')))
  const sorting =
    'function taskTitles(tasks: {title: string; done: boolean; priority: number}[]) { tasks.sort((a,b) => b.priority - a.priority); return tasks.filter(task => !task.done).map(task => task.title) }'
  assert.ok(runRep(sorting, 'interview-frontend').some(result => result.message?.includes('changed its input')))
})

test('object-update rejects an in-place change even when the returned value is right', () => {
  const code =
    'type Task = { title: string; done: boolean; priority: number }; function setDone(task: Task, done: boolean) { task.done = done; return task }'
  const failures = runRep(code, 'object-update').filter(result => !result.passed)
  assert.ok(failures.length > 0)
  assert.ok(failures.every(result => result.message?.includes('changed its input')))
})

test('running a mutating attempt does not corrupt authored inputs', () => {
  runRep('function pageIds(ids: string[], page: number, size: number) { ids.splice(0, ids.length); return ids }', 'backend-page-results')
  const code =
    'function pageIds(ids: string[], page: number, size: number) { page = Math.max(1,page); size = Math.min(3,Math.max(1,size)); return ids.slice((page-1)*size, page*size) }'
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
  assert.ok(
    validateContentDepth(repIds, skillIds, { ...repDepth, orphan: repDepth['sum-positive-numbers'] }).includes(
      'orphan: unknown rep review target',
    ),
  )
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
  assertMutantsFail(mutants)
})

test('DSA application checks reject changed order, deduplication, leaf rules, and route semantics', () => {
  const incorrect = {
    'ticket-service-times':
      'function ticketTimes(tickets) { return tickets.map(t=>({id:t.id,start:t.arrival,finish:t.arrival+t.minutes})) }',
    'parcel-loading-turns': 'function loadingTurn(parcels,targetIndex) { return parcels.length*parcels[targetIndex] }',
    'sorted-offset-squares': 'function squareOffsets(offsets:number[]) { return offsets.map(n=>n*n) }',
    'reading-run-summary': 'function summarizeReadings(readings:number[]) { return [...new Set(readings)].map(value=>({value,count:1})) }',
    'sort-score-records':
      'function orderRecords(records: {id:string;score:number;name:string}[]) { return [...records].sort((a,b)=>a.name.localeCompare(b.name)||a.score-b.score) }',
    'kth-smallest-copy': 'function kthSmallest(numbers:number[],k:number) { return [...new Set(numbers)].sort((a,b)=>a-b)[k-1] ?? null }',
    'count-unique-windows':
      'function countUniqueWindows(labels:string[],k:number) { return labels.length>=k && new Set(labels).size===labels.length ? labels.length-k+1 : 0 }',
    'shortest-run-reaching-target':
      'function shortestRun(numbers:number[],target:number) { let best=0; for(let i=0;i<numbers.length;i++) if(numbers[i]>=target) return 1; let total=numbers.reduce((a,b)=>a+b,0); return total>target?numbers.length:0 }',
    'first-insertion-point': 'function insertionPoint(numbers:number[],target:number) { return numbers.indexOf(target) }',
    'smallest-daily-capacity':
      'function smallestCapacity(weights:number[],days:number) { return weights.length ? Math.max(...weights) : 0 }',
    'flatten-nested-numbers': 'function flattenNumbers(items:unknown[]) { return items.flat(10).filter(Boolean) }',
    'count-object-leaves':
      'function countLeaves(input:Record<string,unknown>):number { return Object.values(input).reduce<number>((sum,value)=>sum+(value ? typeof value === "object" ? countLeaves(value as Record<string,unknown>) : 1 : 0),0) }',
    'tree-depth-sum':
      'function sumAtDepth(root:{value:number;children:any[]}|null,depth:number):number { if(!root)return 0; if(!depth)return root.value; return Math.max(0,...root.children.map(child=>sumAtDepth(child,depth-1))) }',
    'tree-value-path':
      'function pathToValue(root:{value:number;children:any[]}|null,target:number):number[]|null { if(!root)return null; if(root.value===target)return [target]; for(const child of root.children){const path=pathToValue(child,target);if(path)return path}return null }',
    'graph-shortest-hops': 'function shortestHops(graph:number[][],start:number,target:number) { if(start===target)return 0; return null }',
    'graph-connected-groups': 'function connectedGroups(graph:number[][]) { return graph.filter(neighbors=>neighbors.length===0).length }',
    'simplify-file-path':
      'function simplifyPath(path:string) { return "/"+path.split("/").filter(part=>part && !part.startsWith(".")).join("/") }',
  }
  assertMutantsFail(Object.entries(incorrect))
})

test('extra journey practice rejects boundary, ordering, and command mistakes', () => {
  const incorrect = {
    'sum-in-range': 'function sumInRange(numbers, low, high) { return numbers.filter(n => n > low && n < high).reduce((a,b) => a+b,0) }',
    'adjacent-rise-count': 'function countRises(numbers) { return numbers.slice(1).filter((n,i) => n >= numbers[i]).length }',
    'last-matching-word':
      'function lastMatchingWord(words, suffix) { return words.find(w => w.toLowerCase().endsWith(suffix.toLowerCase())) ?? null }',
    'word-length-span':
      'function wordLengthSpan(words) { const lengths=words.map(w=>w.trim().length); return words.length ? Math.max(...lengths)-Math.min(...lengths) : 0 }',
    'shared-number-count': 'function sharedNumberCount(left,right) { return left.filter(n=>right.includes(n)).length }',
    'singleton-number-list': 'function singletonNumbers(numbers) { return [...new Set(numbers)] }',
    'undo-word-actions':
      'function applyWordActions(actions) { const out=[]; for(const a of actions) { if(a === "UNDO") out.shift(); else out.push(a) } return out }',
    'erase-text-markers': 'function eraseMarkers(text) { return text.replaceAll("#", "") }',
  }
  assertMutantsFail(Object.entries(incorrect))
})
