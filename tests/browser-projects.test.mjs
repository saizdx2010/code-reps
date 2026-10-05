import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { browserProjects, projectReflection } from '../src/browser-projects.ts'
import { reps } from '../src/rep.ts'
import { journeys, getJourney } from '../src/learning.ts'
import { runRep } from '../src/runner.ts'
import { browserStateSolutions } from './fixtures/browser-state-solutions.mjs'

test('external project levels link real preparation and create portable notebook-sized reviews', () => {
  assert.deepEqual(browserProjects.map(project => project.level), [1, 2, 3])
  assert.equal(new Set(browserProjects.map(project => project.id)).size, 3)
  for (const project of browserProjects) {
    for (const id of project.preparation) assert.ok(reps.some(rep => rep.id === id), id)
    const reflection = projectReflection(project)
    assert.ok(reflection.includes('learner-reported'))
    assert.ok(reflection.includes('Not checked'))
    for (const requirement of project.requirements) assert.ok(reflection.includes(requirement))
    assert.ok(reflection.length <= 20_000, `${project.id}: exceeds existing notebook contract`)
  }
})

test('state modeling requires unhinted distinct recall after three days', () => {
  const journey = journeys.find(item => item.id === 'state-modeling')
  const time = Date.parse('2026-10-01T12:00:00Z')
  const record = (repId, days, hintCount = 0) => ({repId, completedAt: new Date(time + days * 86_400_000).toISOString(), hintCount})
  const history = [record(journey.guided, 0), record(journey.independent, 1)]
  assert.equal(getJourney(journey, [history[0], record(journey.independent, 1, 1)]).stage, 'practising')
  assert.equal(getJourney(journey, [...history, record(journey.recall, 3)]).stage, 'independent')
  assert.equal(getJourney(journey, [...history, record(journey.recall, 4, 1)]).stage, 'independent')
  assert.equal(getJourney(journey, [...history, record(journey.recall, 4)]).stage, 'retained')
})

test('state checks reject normalization, truthiness, deduplication and mutation mistakes', () => {
  const incorrect = {
    'task-state-label': `function taskLabel(s) { return s.kind === 'draft' ? (s.title.trim() ? 'Draft: '+s.title.trim() : 'Untitled draft') : s.kind === 'failed' ? 'Error: '+s.message : (s.done ? 'Done: ' : 'Open: ')+s.title.trim() }`,
    'saved-record-status': `function saveStatus(s) { return s.status === 'idle' ? {text:'Not saved',retry:false} : s.status === 'saved' ? {text:'Saved '+s.count+' books',retry:false} : {text:s.reason,retry:Boolean(s.reason)} }`,
    'catalog-request-summary': `function requestSummary(xs) { return {pending:[...new Set(xs.filter(x=>x.status==='pending').map(x=>x.id))],empty:xs.filter(x=>x.status==='ready'&&x.titles.every(t=>!t)).map(x=>x.id),errors:xs.filter(x=>x.status==='failed').map(x=>({id:x.id,message:x.error}))} }`,
  }
  for (const [id, code] of Object.entries(incorrect)) assert.ok(runRep(code, id).some(result => !result.passed), id)
  const mutating = browserStateSolutions['catalog-request-summary'].replace('return {', 'requests.reverse(); return {')
  assert.ok(runRep(mutating, 'catalog-request-summary').some(result => result.message?.includes('changed its input')))
})

test('authored state reference solutions pass strict semantic checks; invalid field access fails', () => {
  function diagnostics(code) {
    const filename = '/virtual/solution.ts'
    const options = {strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, skipLibCheck: true, types: []}
    const host = ts.createCompilerHost(options)
    const read = host.readFile.bind(host)
    const exists = host.fileExists.bind(host)
    host.readFile = name => name === filename ? code : read(name)
    host.fileExists = name => name === filename || exists(name)
    const program = ts.createProgram([filename], options, host)
    return ts.getPreEmitDiagnostics(program)
  }
  for (const [id, code] of Object.entries(browserStateSolutions)) assert.equal(diagnostics(code).length, 0, id)
  assert.ok(diagnostics("type State = {status: 'pending'} | {status: 'ready'; data: string[]}\nfunction count(s: State) { return s.data.length }").some(diagnostic => diagnostic.code === 2339))
})
