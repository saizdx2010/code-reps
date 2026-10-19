import assert from 'node:assert/strict'
import test from 'node:test'
import { runAsyncRep } from '../src/runner.ts'
import { paths } from '../src/path.ts'
import { journeys } from '../src/learning.ts'
import { recallVariants } from '../src/fluency.ts'
import { trackBuildsOn, trackGroups } from '../src/curriculum.ts'
import { repLevel } from '../src/rep-levels.ts'
import { devopsReps } from '../src/devops-reps.ts'
import { devopsSkills } from '../src/devops-knowledge.ts'
import { devopsSolutions } from './fixtures/devops-solutions.mjs'

const failed = async (id, code) => (await runAsyncRep(code, id)).filter(result => !result.passed).map(result => result.name)
const solution = id => devopsSolutions[id]

/** Each mutant names the authored check that must catch it, so a check that stops testing its rule fails here. */
async function assertCaught(id, mutants) {
  assert.deepEqual(await failed(id, solution(id)), [], `${id} reference`)
  for (const [code, check] of mutants) {
    assert.notEqual(code, solution(id), `${id}: a mutant for "${check}" did not change the reference`)
    assert.ok((await failed(id, code)).includes(check), `${id}: "${check}" did not catch ${code}`)
  }
}

test('DevOps is the last track, builds on Backend, and opens with a Beginner rep', () => {
  const devops = paths.find(path => path.id === 'devops')
  assert.equal(paths.at(-1), devops)
  assert.equal(trackGroups.flatMap(group => group.pathIds).at(-1), 'devops')
  assert.equal(trackBuildsOn.devops, 'backend')
  assert.equal(devops.stages[0].title, 'Read CI output')
  assert.equal(repLevel(devops.stages[0].repIds[0]), 1)
})

test('DevOps reps are function reps over authored inputs, placed on the track, with references and journeys', () => {
  const devops = paths.find(path => path.id === 'devops')
  const placed = new Set(devops.stages.flatMap(stage => stage.repIds))
  for (const rep of devopsReps) {
    assert.equal(rep.format, 'devops', rep.id)
    assert.equal(rep.category, 'DevOps', rep.id)
    assert.ok(rep.functionName, rep.id)
    assert.equal(rep.sql, undefined, rep.id)
    assert.ok(placed.has(rep.id), `${rep.id} is on the DevOps track`)
    assert.ok(devopsSolutions[rep.id], `${rep.id} needs a reference solution`)
    // Every note says the checks prove the function's output, not a shell, Docker, CI, or a network.
    assert.match(rep.note, /authored inputs; they do not run a shell, Docker, a CI service, or a real network\./, rep.id)
  }
  for (const id of placed)
    assert.ok(
      devopsReps.some(rep => rep.id === id),
      `${id} on the DevOps track is a DevOps rep`,
    )
  for (const skill of devopsSkills) {
    const journey = journeys.find(item => item.id === skill.id)
    assert.ok(journey, `${skill.id} has a journey`)
    assert.deepEqual(recallVariants[journey.id], [journey.recall, journey.independent, journey.guided])
    for (const id of [journey.guided, journey.independent, journey.recall, ...(journey.practice ?? [])])
      assert.ok(skill.repIds.includes(id), id)
  }
})

test('D1 CI output checks catch range, cleaning, word, condition, matcher, and blame mistakes', async () => {
  const exit = solution('devops-exit-meaning')
  await assertCaught('devops-exit-meaning', [
    [exit.replace('code > 128', 'code >= 128'), 'Treats 128 as an ordinary failure'],
    [exit.replace('(code - 128)', '(code - 127)'), 'Reads signal 9 from 137'],
    [exit.replace("  if (code === 126) return 'not executable'\n", ''), 'Names 126'],
    [exit.replace("  if (code === 127) return 'command not found'\n", ''), 'Names 127'],
    [exit.replace("'failed with code ' + code", "'failed'"), 'Reports an ordinary failure'],
    [exit.replace('code > 128', 'code > 128 && code < 255'), 'Handles the largest code'],
  ])
  const first = solution('devops-first-error')
  await assertCaught('devops-first-error', [
    [first.replace("lower.startsWith('warn') || ", ''), 'Skips warnings that mention an error'],
    [first.replace(" || lower.includes('process completed with exit code')", ''), 'Skips the line that reports the exit code'],
    [first.replace('/^(error|fatal)\\b/', '/^(error|fatal)/'), 'Needs the whole word error'],
    [first.replace(".replace(/\\u001b\\[[0-9;]*m/g, '')", ''), 'Removes colour codes'],
    [first.replace('(\\.\\d+)?Z /', 'Z /'), 'Removes a leading timestamp'],
    [
      first.replace(".replace(/\\u001b\\[[0-9;]*m/g, '')\n", '').replace('.trim()\n', ".replace(/\\u001b\\[[0-9;]*m/g, '').trim()\n"),
      'Removes colour codes before the timestamp',
    ],
    [
      first.replace('/^\\d{4}', '/\\d{4}').replace("(\\.\\d+)?Z /, '')", "(\\.\\d+)?Z /g, '')"),
      'Keeps a timestamp that is not at the start',
    ],
    [first.replace(" || lower.includes(': error ')", ''), 'Finds a compiler error inside the line'],
    [first.replace(" || lower.startsWith('npm err!')", ''), 'Finds an npm error'],
    [first.replace('line: index + 1', 'line: index'), 'Counts blank lines and trims spaces'],
    [first.replace('const lower = text.toLowerCase()', 'const lower = text'), 'Finds the error in the example'],
    [first.replace('      .trim()\n', '\n'), 'Counts blank lines and trims spaces'],
  ])
  const steps = solution('devops-step-outcomes')
  await assertCaught('devops-step-outcomes', [
    [steps.replace("(step.when === 'failure' && failed)", "step.when === 'failure'"), 'Skips a failure step when nothing failed'],
    [steps.replace("step.when === 'always' || ", ''), 'Runs failure and always steps after a failure'],
    [
      steps.replace(
        "if (step.continueOnError) return { name: step.name, outcome: 'ignored' }",
        "if (step.continueOnError) {\n      failed = true\n      return { name: step.name, outcome: 'ignored' }\n    }",
      ),
      'An ignored failure does not start failure steps',
    ],
    [
      steps.replace(
        "    if (!runs) return { name: step.name, outcome: 'skipped' }\n",
        "    if (!runs && step.exitCode === 0) return { name: step.name, outcome: 'skipped' }\n",
      ),
      'A skipped step never fails',
    ],
    [steps.replace('    failed = true\n', "    if (step.when !== 'always') failed = true\n"), 'A failing always step fails the job'],
    [
      steps.replace("if (step.continueOnError) return { name: step.name, outcome: 'ignored' }", ''),
      'An ignored failure does not fail the job',
    ],
  ])
  const notes = solution('devops-error-annotations')
  await assertCaught('devops-error-annotations', [
    [notes.replace('(.+)$/.exec(raw.trim())', '(.+)/.exec(raw.trim())').replace('/^([^', '/([^'), 'Ignores other formats'],
    [notes.replace('): error (TS\\d+): (.+)$/', '): error (TS\\d+):? ?(.*)$/'), 'Needs a message'],
    [notes.replace('[^\\s()]+', '[^()]+'), 'Refuses a path with spaces'],
    [notes.replace('.exec(raw.trim())', '.exec(raw)'), 'Trims each line'],
    [notes.replace('    if (seen.has(key)) continue\n', ''), 'Drops a repeated error without counting it'],
    [
      notes.replace('const key = [file, line, column, code].join', 'const key = [file, line, column].join'),
      'Keeps two codes at one position',
    ],
    [notes.replace('    else omitted++\n', ''), 'Applies the limit and counts the rest'],
    [notes.replace('line: Number(line), column: Number(column)', 'line, column'), 'Reads the example'],
    [notes.replace('found.length < limit', 'found.length <= limit'), 'Applies the limit and counts the rest'],
    [notes.replace('(.+)$/', '([^:]+)$/'), 'Keeps colons in the message'],
  ])
  const blame = solution('devops-failing-step')
  await assertCaught('devops-failing-step', [
    [blame.replace(' && !item.continueOnError', ''), 'Ignores error lines in an allowed failure'],
    [blame.replace('steps.find(', 'steps.findLast('), 'Reports the first failing step, not a later one'],
    [blame.replace('/^(error|fatal)\\b/i', '/^(error|fatal)/i'), 'Needs the whole word'],
    [blame.replace('/^(error|fatal)\\b/i', '/^(error|fatal)\\b/'), 'Trims the line it reports'],
    [blame.replace('.test(line.trim())', '.test(line)'), 'Names the step in the example'],
    [blame.replace('cause: step.log[index].trim()', 'cause: step.log[index]'), 'Trims the line it reports'],
    [blame.replace('code > 128', 'code >= 128'), 'Treats 128 as a plain exit code'],
    [blame.replace("code === 127 ? 'command not found' : ", ''), 'Describes a missing command'],
    [
      blame
        .replace('  if (index !== -1) return { step: step.name, line: index + 1, cause: step.log[index].trim() }\n', '')
        .replace(
          '  return { step: step.name, line: null, cause }',
          '  return index !== -1 && code < 128 ? { step: step.name, line: index + 1, cause: step.log[index].trim() } : { step: step.name, line: null, cause }',
        ),
      'Prefers a log line over the exit code',
    ],
    [
      blame.replace('  if (!step) return null\n', "  if (!step) return { step: '', line: null, cause: 'passed' }\n"),
      'Returns null when every step passed',
    ],
  ])
})
