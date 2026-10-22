import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { decodeFiles } from '../src/project-files.ts'
import { repDepth } from '../src/rep-depth.ts'
import { reps } from '../src/rep.ts'

// The editor checks each file as a script with the TypeScript service's defaults, which include the DOM library. These
// tests use the same setup, so a starter that redeclares a browser global (such as Request) shows up here first.
const options = { target: ts.ScriptTarget.ESNext, noEmit: true, jsx: ts.JsxEmit.Preserve, allowNonTsExtensions: true }
const host = ts.createCompilerHost(options)
const libraries = new Map()
const baseGetSourceFile = host.getSourceFile.bind(host)

function typeErrors(name, text) {
  const program = ts.createProgram([name], options, {
    ...host,
    fileExists: file => file === name || host.fileExists(file),
    readFile: file => (file === name ? text : host.readFile(file)),
    getSourceFile: (file, language) => {
      if (file === name) return ts.createSourceFile(file, text, language)
      if (!libraries.has(file)) libraries.set(file, baseGetSourceFile(file, language))
      return libraries.get(file)
    },
  })
  return ts
    .getPreEmitDiagnostics(program, program.getSourceFile(name))
    .filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)
    .map(diagnostic => ({ code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ') }))
}

// Single-file, non-React TypeScript reps: multi-file projects resolve their sibling modules only inside the editor, and
// SQL reps are SQL text.
const singleFile = reps.filter(rep => !decodeFiles(rep.starter) && !rep.reactPreview && rep.format !== 'sql')
const missingReturn = new Set([2355, 2366])

// Starter errors that are part of the exercise: the editor flags the same null the error report shows, and the invented
// string method that the suggested draft calls.
const intendedStarterErrors = new Set([
  "stack-trace-null-lookup: Object is possibly 'null'.",
  "ai-invented-api: Property 'capitalize' does not exist on type 'string'.",
])

test('single-file starters have no type errors except the body still to be written', () => {
  const problems = singleFile.flatMap(rep =>
    typeErrors(`/${rep.id}/solution.ts`, rep.starter)
      .filter(error => !missingReturn.has(error.code))
      .map(error => `${rep.id}: ${error.message}`),
  )
  assert.deepEqual(
    problems.filter(problem => !intendedStarterErrors.has(problem)),
    [],
  )
  for (const intended of intendedStarterErrors) assert.ok(problems.includes(intended), `${intended} is no longer reported`)
})

test('traced reference code type-checks with its starter declarations', () => {
  const problems = singleFile
    .filter(rep => repDepth[rep.id]?.traceSteps)
    .flatMap(rep => {
      const code = repDepth[rep.id].traceSteps.code.join('\n')
      // A trace may leave out the starter's type declarations to keep the shown code short.
      const declarations = rep.starter.split('\n').filter(line => {
        const declared = line.match(/^(?:type|interface) (\w+)/)?.[1]
        return declared && !new RegExp(`\\b(?:type|interface) ${declared}\\b`).test(code)
      })
      return typeErrors(`/${rep.id}/solution.ts`, [...declarations, code].join('\n')).map(error => `${rep.id}: ${error.message}`)
    })
  assert.deepEqual(problems, [])
})

test('editor type issues sort by file and line, drop repeats, and summarize honestly', async () => {
  const { sortTypeIssues, typeCheckSummary } = await import('../src/type-issues.ts')
  const issues = sortTypeIssues([
    { file: 'view.ts', line: 2, message: 'b' },
    { file: 'state.ts', line: 9, message: 'a' },
    { file: 'state.ts', line: 3, message: 'a' },
    { file: 'state.ts', line: 3, message: 'a' },
  ])
  assert.deepEqual(
    issues.map(issue => `${issue.file}:${issue.line}`),
    ['state.ts:3', 'state.ts:9', 'view.ts:2'],
  )
  assert.match(typeCheckSummary(undefined), /unavailable/)
  assert.equal(typeCheckSummary([]), 'Type check: no type errors in the editor.')
  assert.equal(typeCheckSummary(issues.slice(0, 1)), 'Type check: 1 type error in the editor.')
  assert.equal(typeCheckSummary(issues), 'Type check: 3 type errors in the editor.')
})
