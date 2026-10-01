import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { decodeFiles, encodeFiles } from '../src/project-files.ts'
import { compileSolution } from '../src/compile-solution.ts'
import { runRep } from '../src/runner.ts'
import { buildFrontendFrame } from '../src/frontend-frame.ts'
import { capstoneReps } from '../src/capstone-reps.ts'
import { capstoneSolutions } from './fixtures/capstone-solutions.mjs'
test('multi-file backend reference passes request and query boundary integration checks',()=>{
  assert.deepEqual(runRep(capstoneSolutions['project-ticket-api'],'project-ticket-api').filter(r=>!r.passed),[])
})
test('multi-file frontend reference passes the real DOM interaction checks',()=>{
  const rep=capstoneReps.find(r=>r.id==='project-team-directory');let report
  const dom=new JSDOM(buildFrontendFrame(capstoneSolutions[rep.id],rep,'capstone','checks'),{runScripts:'dangerously',beforeParse(window){window.postMessage=value=>report=value}})
  try {assert.ok(report.results.every(r=>r.passed),JSON.stringify(report))} finally{dom.window.close()}
})
test('module loader reports missing or external imports without exposing host require',()=>{
  for(const specifier of ['./missing','node:fs','../escape']) {
    const code=encodeFiles({entry:'main.ts',files:{'main.ts':`import { value } from '${specifier}'; export function solve(){return value}`}})
    assert.throws(()=>new Function(compileSolution(code,'solve'))(),/Missing local module|Only local project imports/)
  }
})
test('serialized project editing keeps every other file and checks syntax in the named file',()=>{
  const project=decodeFiles(capstoneSolutions['project-ticket-api']);const original=project.files['query.ts']
  const edited=encodeFiles({...project,files:{...project.files,'handler.ts':'export function handleTickets(){ return null }'}})
  assert.equal(decodeFiles(edited).files['query.ts'],original)
  assert.throws(()=>compileSolution(encodeFiles({...project,files:{...project.files,'query.ts':'export const ='}}),'handleTickets'),/query.ts/)
  assert.equal(decodeFiles('function ordinary() {}'),null)
})
