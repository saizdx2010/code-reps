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

test('D2 configuration checks catch parsing, default, error-collection, masking, and comparison mistakes', async () => {
  const port = solution('devops-read-port')
  await assertCaught('devops-read-port', [
    [port.replace('/^[0-9]+$/.test(raw) ? Number(raw) : NaN', 'parseInt(raw, 10)'), 'Refuses trailing letters'],
    [port.replace('/^[0-9]+$/.test(raw) ? Number(raw) : NaN', 'Number(raw)'), 'Refuses exponent notation'],
    [port.replace('/^[0-9]+$/.test(raw) ? Number(raw) : NaN', 'Number(raw)'), 'Refuses a sign'],
    [port.replace('port >= 1 &&', 'port >= 0 &&'), 'Refuses port 0'],
    [port.replace('port <= 65535', 'port < 65535'), 'Accepts the highest port'],
    [port.replace('env.PORT.trim()', 'env.PORT'), 'Reads the example'],
    [port.replace("Object.hasOwn(env, 'PORT') ? env.PORT.trim() : ''", "(env.PORT ?? env.port ?? '').trim()"), 'Matches the name exactly'],
    [
      port.replace("if (raw === '') return { ok: true, port: 3000 }", "if (!Object.hasOwn(env, 'PORT')) return { ok: true, port: 3000 }"),
      'Uses 3000 when PORT is blank',
    ],
  ])
  const env = solution('devops-validate-env')
  await assertCaught('devops-validate-env', [
    [
      env.replace(
        "const raw = given !== '' ? given : setting.default?.trim()",
        'const raw = Object.hasOwn(env, setting.name) ? given : setting.default?.trim()',
      ),
      'Uses the default for a blank value',
    ],
    [
      env.replace("errors.push(setting.name + ' is required')", "return { ok: false, errors: [setting.name + ' is required'] }"),
      'Reports every problem in schema order',
    ],
    [env.replace('/^-?[0-9]+$/', '/^[0-9]+$/'), 'Accepts a negative integer'],
    [env.replace('/^-?[0-9]+$/.test(raw)', '!Number.isNaN(parseInt(raw, 10))'), 'Refuses an integer with letters'],
    [env.replace('/^-?[0-9]+$/.test(raw)', 'Number.isFinite(Number(raw))'), 'Refuses a decimal integer'],
    [env.replace('const lower = raw.toLowerCase()', 'const lower = raw'), 'Reads the example'],
    [
      env
        .replace("lower === 'true' || lower === '1'", "lower === 'true'")
        .replace("lower === 'false' || lower === '0'", "lower === 'false'"),
      'Reads 1 and 0 as booleans',
    ],
    [
      env.replace("else errors.push(setting.name + ' must be true or false')", 'else config[setting.name] = false'),
      'Refuses other boolean words',
    ],
    [
      env.replace(
        "if (setting.type === 'string') config[setting.name] = raw",
        "if (setting.type === 'string') config[setting.name] = env[setting.name] ?? raw",
      ),
      'Trims a string but keeps inner spaces',
    ],
    [
      env.replace("if (setting.required) errors.push(setting.name + ' is required')", "errors.push(setting.name + ' is required')"),
      'Leaves out an optional setting with no value',
    ],
    [
      env.replace(
        "    if (setting.type === 'string') config[setting.name] = raw\n",
        "    if (raw === setting.default) config[setting.name] = raw\n    else if (setting.type === 'string') config[setting.name] = raw\n",
      ),
      'Converts a default by its type',
    ],
  ])
  const mask = solution('devops-mask-secrets')
  await assertCaught('devops-mask-secrets', [
    [mask.replace('    .sort((a, b) => b.length - a.length)\n', ''), 'Masks a longer value before a shorter one inside it'],
    [mask.replace("text.replaceAll(value, '***')", "text.replace(value, '***')"), 'Masks every occurrence'],
    [mask.replace("text.replaceAll(value, '***')", "text.replace(new RegExp(value, 'g'), '***')"), 'Treats a value as plain text'],
    [mask.replace('env[name].length >= 4', 'env[name].length > 0'), 'Skips values shorter than 4 characters'],
    [mask.replace('env[name].length >= 4', 'env[name].length > 4'), 'Skips values shorter than 4 characters'],
    [
      // A function replacer keeps "$&" in the mutant's code instead of letting replace() expand it.
      mask.replace(
        "text.replaceAll(value, '***')",
        () => "text.replace(new RegExp(value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'gi'), '***')",
      ),
      'Matches case exactly',
    ],
    [mask.replace('const values = sensitive', 'const values = Object.keys(env)'), 'Leaves variables that are not sensitive'],
  ])
  const dotenv = solution('devops-parse-dotenv')
  await assertCaught('devops-parse-dotenv', [
    [dotenv.replace("const at = line.indexOf('=')", "const at = line.lastIndexOf('=')"), 'Keeps "=" inside a value'],
    [dotenv.replace("value.indexOf(' #')", "value.indexOf('#')"), 'Keeps "#" without a space before it'],
    [
      dotenv
        .replace(
          '    if (value.length >= 2 && (quote === \'"\' || quote === "\'") && value.endsWith(quote)) value = value.slice(1, -1)\n    else {\n',
          '    {\n',
        )
        .replace(
          '    values[name] = value\n',
          '    if (value.length >= 2 && (quote === \'"\' || quote === "\'") && value.endsWith(quote)) value = value.slice(1, -1)\n    values[name] = value\n',
        ),
      'Reads the example',
    ],
    [dotenv.replace('(quote === \'"\' || quote === "\'")', "quote === '\"'"), 'Removes single quotes'],
    [dotenv.replace(' && value.endsWith(quote)', ' && /["\']$/.test(value)'), 'Keeps mismatched quotes'],
    [dotenv.replace("    if (line.startsWith('export ')) line = line.slice('export '.length)\n", ''), 'Removes a leading export'],
    [dotenv.replace('/^[A-Za-z_][A-Za-z0-9_]*$/', '/^[A-Za-z0-9_-]+$/'), 'Reports bad lines by number'],
    [dotenv.replace('errors.push(index + 1)', 'errors.push(index)'), 'Reports bad lines by number'],
    [
      dotenv
        .replace('let line = raw.trim()', "let line = raw.replace(/^ +| +$/g, '')")
        .replace('let value = line.slice(at + 1).trim()', "let value = line.slice(at + 1).replace(/^ +| +$/g, '')"),
      'Handles Windows line endings',
    ],
    [dotenv.replace('line.slice(0, at).trim()', 'line.slice(0, at)'), 'Trims around the name and value'],
    [dotenv.replace('value.length >= 2 &&', ''), 'Keeps a lone quote character'],
  ])
  const drift = solution('devops-config-drift')
  await assertCaught('devops-config-drift', [
    [
      drift.replace('const inStaging = Object.hasOwn(staging, name)', 'const inStaging = Boolean(staging[name])'),
      'Counts an empty value as present',
    ],
    [
      drift.replace('...Object.keys(production)])].sort()', '...Object.keys(production)])].sort((a, b) => a.localeCompare(b))'),
      'Sorts names with the default sort',
    ],
    [drift.replace("staging: hide ? '***' : staging[name]", 'staging: staging[name]'), 'Reports the example'],
    [drift.replace('const hide = sensitive.includes(name)', 'const hide = sensitive.length > 0'), 'Hides only sensitive names'],
    [
      drift.replace(
        "if (!inProduction) report.push({ name, change: 'missing in production' })",
        "if (!inProduction) report.push({ name, change: 'missing in production', staging: staging[name] })",
      ),
      'Never shows a sensitive value that is missing elsewhere',
    ],
    [
      drift.replace('staging[name] !== production[name]', 'staging[name].trim().toLowerCase() !== production[name].trim().toLowerCase()'),
      'Compares values exactly',
    ],
    [drift.replace('    else if (staging[name] !== production[name]) {', '    else {'), 'Leaves equal values out'],
  ])
})
