import ts from 'typescript'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import { JSDOM } from 'jsdom'
import { connectedFeatureReps } from '../src/connected-feature-reps.ts'
import { connectedSolutions } from './fixtures/connected-feature-solutions.mjs'
import { encodeFiles, decodeFiles } from '../src/project-files.ts'
import { compileSolution } from '../src/compile-solution.ts'
import { buildFrontendFrame } from '../src/frontend-frame.ts'
import { repDepth } from '../src/rep-depth.ts'
import { reflectionGuides } from '../src/reflection-guides.ts'
import { reps } from '../src/rep.ts'

function failures(rep, files) {
  const code = typeof files === 'string' ? files : encodeFiles({ entry: 'main.ts', files })
  if (!rep.domPreview) {
    const fn = new Function(compileSolution(code, rep.functionName) + '\nreturn inspect')()
    return rep.checks.filter(check => {
      const args = structuredClone(check.input)
      const before = JSON.stringify(args)
      return !isDeepStrictEqual(fn(...args), check.expected) || JSON.stringify(args) !== before
    }).map(check => check.name)
  }
  let report
  const dom = new JSDOM(buildFrontendFrame(code, rep, 'connected', 'checks'), { runScripts: 'dangerously', beforeParse(window) { window.postMessage = data => { report = data } } })
  try {
    assert.ok(report, rep.id)
    return report.error ? [report.error] : Array.from(report.results).filter(result => !result.passed).map(result => `${result.name}: ${result.message}`)
  } finally { dom.window.close() }
}

test('connected feature references pass every checkpoint and starters need work', () => {
  for (const [index, rep] of connectedFeatureReps.entries()) {
    assert.ok(reps.includes(rep) && repDepth[rep.id] && reflectionGuides[rep.id], rep.id)
    assert.ok(decodeFiles(rep.starter), rep.id)
    assert.deepEqual(failures(rep, connectedSolutions[index]), [], rep.id)
    assert.ok(failures(rep, rep.starter).length, `${rep.id}: starter must need work`)
  }
})

test('guided checkpoint starters preserve previous completed owners', () => {
  const changed = ['view.ts', 'main.ts', 'main.ts', 'storage.ts', 'tests.ts']
  for (let index = 1; index < 6; index++) {
    const starter = decodeFiles(connectedFeatureReps[index].starter).files
    for (const [name, source] of Object.entries(connectedSolutions[index - 1])) {
      if (name !== changed[index - 1] && name !== 'main.ts') assert.equal(starter[name], source, `${index}: ${name}`)
    }
  }
})

test('integration checks reject broken save, recovery, safe rendering, and learner tests', () => {
  const rep = connectedFeatureReps[6]
  for (const [file, before, after] of [
    ['view.ts', 'output.textContent = text', 'output.innerHTML = text'],
    ['main.ts', "status: 'Unsaved'", "status: 'Saved'"],
    ['main.ts', 'if (props.failSave)', 'if (false)'],
    ['storage.ts', 'value.version !== 1', 'false'],
    ['storage.ts', 'value.text.length > 80', 'value.text.length >= 80'],
    ['tests.ts', "['version',", "['version-omitted',"],
  ]) {
    const files = { ...connectedSolutions[6] }
    // The transition belongs to state.ts, rather than the DOM entry.
    const owner = before === "status: 'Unsaved'" ? 'state.ts' : file
    files[owner] = files[owner].replace(before, after)
    assert.notEqual(files[owner], connectedSolutions[6][owner], before)
    assert.ok(failures(rep, files).length, before)
  }
})


test('reference project files typecheck separately from behavioral checks', () => {
  const directory = mkdtempSync(join(tmpdir(), 'connected-feature-'))
  try {
    for (const [index, files] of connectedSolutions.entries()) {
      const project = join(directory, String(index))
      mkdirSync(project)
      for (const [name, source] of Object.entries(files)) writeFileSync(join(project, name), source)
      const program = ts.createProgram(Object.keys(files).map(name => join(project, name)), {
        noEmit: true, strict: true, skipLibCheck: true, types: [],
        target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
      })
      const diagnostics = ts.getPreEmitDiagnostics(program)
      assert.deepEqual(diagnostics.map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')), [], connectedFeatureReps[index].id)
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
