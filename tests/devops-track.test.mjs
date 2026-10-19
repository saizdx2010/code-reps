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

test('D3 version checks catch text order, reset, pre-release, kind, and range-limit mistakes', async () => {
  const compare = solution('devops-compare-versions')
  await assertCaught('devops-compare-versions', [
    [compare.replace(".split('.').map(Number)", ".split('.')"), 'Compares the example as numbers'],
    [compare.replace("version.replace(/^v/, '')", 'version'), 'Ignores a leading v'],
    [compare.replace('return left[index] < right[index] ? -1 : 1', 'return left[index] - right[index]'), 'Returns 1, not the difference'],
    [compare.replace('index < 3', 'index < 1'), 'Finds a lower patch'],
    [compare.replace('index < 3', 'index < 2'), 'Returns 1, not the difference'],
    [`function compareVersions(a: string, b: string) { return a.localeCompare(b) }`, 'Compares the example as numbers'],
  ])
  const next = solution('devops-next-version')
  await assertCaught('devops-next-version', [
    [next.replace("[major, minor + 1, 0].join('.')", "[major, minor + 1, patch].join('.')"), 'Picks a feature over a fix'],
    [next.replace('major === 0 ? [0, minor + 1, 0] : [major + 1, 0, 0]', '[major + 1, 0, 0]'), 'Raises minor for a breaking change in 0.x'],
    [next.replace("current.split('.').map(Number)", "current.split('.') as any"), 'Adds as numbers'],
    [
      next.replace("if (changes.includes('fix'))", "if (changes.includes('fix') || changes.includes('docs'))"),
      'Makes no release for docs only',
    ],
    [next.replace("changes.includes('breaking')", "changes[0] === 'breaking'"), 'Checks every change, not only the first'],
    [next.replace('[major + 1, 0, 0]', '[major + 1, minor, patch]'), 'Raises major for a breaking change'],
  ])
  const sorter = solution('devops-sort-versions')
  await assertCaught('devops-sort-versions', [
    [sorter.replace('return Number(a) - Number(b)', 'return a < b ? -1 : a > b ? 1 : 0'), 'Sorts the example'],
    [sorter.replace('    if (numeric(a)) return -1\n    if (numeric(b)) return 1\n', ''), 'Puts number identifiers before words'],
    [sorter.replace('return a < b ? -1 : a > b ? 1 : 0', 'return a.localeCompare(b)'), 'Compares words by character code'],
    [sorter.replace('return b.pre.length - a.pre.length', 'return a.pre.length - b.pre.length'), 'Sorts the example'],
    [sorter.replace('    return a.pre.length - b.pre.length\n  }', '    return 0\n  }'), 'Puts a shorter pre-release first'],
    [sorter.replace("const withoutBuild = version.split('+')[0]", 'const withoutBuild = version'), 'Ignores build information'],
    [sorter.replace("withoutBuild.slice(dash + 1).split('.')", '[withoutBuild.slice(dash + 1)]'), 'Sorts the example'],
    [
      sorter.replace("withoutBuild.slice(dash + 1).split('.')", "withoutBuild.split('-')[1].split('.')"),
      'Keeps hyphens inside an identifier',
    ],
    [
      sorter.replace('.map(Number)', '').replace('return a.main[index] - b.main[index]', 'return a.main[index] < b.main[index] ? -1 : 1'),
      'Compares main parts as numbers',
    ],
    [sorter.replace('return [...versions].sort(compare)', 'return [...versions].sort(compare).reverse()'), 'Sorts the example'],
  ])
  const lock = solution('devops-lockfile-diff')
  await assertCaught('devops-lockfile-diff', [
    [
      lock.replace(
        "const parts = (version: string) => version.split('.').map(Number)",
        "const parts = (version: string) => version.split('.')",
      ),
      'Compares versions as numbers',
    ],
    [
      lock.replace('const index = [0, 1, 2].find(i => a[i] !== b[i])', 'const index = [2, 1, 0].find(i => a[i] !== b[i])'),
      'Names a major change even when minor went down',
    ],
    [lock.replace('...Object.keys(after)])].sort()', '...Object.keys(after)])]'), 'Sorts every list by name'],
    [
      lock
        .replace('    if (from === undefined) added.push(', '    if (from === undefined && to !== undefined) added.push(')
        .replace("added.push(name + '@' + to)", 'added.push(name)'),
      'Summarises the example',
    ],
    [
      lock.replace(
        '      if (index === undefined) continue\n',
        "      if (index === undefined) {\n        upgraded.push({ name, from, to, kind: 'patch' })\n        continue\n      }\n",
      ),
      'Leaves unchanged packages out',
    ],
    [lock.replace('      else downgraded.push({ name, from, to })\n', ''), 'Reports a downgrade'],
    [
      lock
        .replace('const to = Object.hasOwn(after, name) ? after[name] : undefined', 'const to = after[name] || undefined')
        .replace("removed.push(name + '@' + from)", 'removed.push(name)'),
      'Reports a removed package',
    ],
  ])
  const range = solution('devops-satisfies-range')
  await assertCaught('devops-satisfies-range', [
    [
      range.replace('major > 0 ? [major + 1, 0, 0] : minor > 0 ? [0, minor + 1, 0] : [0, 0, patch + 1]', '[major + 1, 0, 0]'),
      'Stops a 0.x caret range at the next minor',
    ],
    [
      range.replace('minor > 0 ? [0, minor + 1, 0] : [0, 0, patch + 1]', '[0, minor + 1, 0]'),
      'Stops a 0.0.x caret range at the next patch',
    ],
    [range.replace('return compare(v, limit) < 0', 'return compare(v, limit) <= 0'), 'Refuses the next major in a caret range'],
    [range.replace("operator === '~' ? [major, minor + 1, 0] : ", ''), 'Refuses the next minor in a tilde range'],
    [range.replace('  if (compare(v, base) < 0) return false\n', ''), 'Refuses a version below the base'],
    [
      range.replace("if (operator === '>=') return true", "if (operator === '>=') return compare(v, [base[0] + 1, 0, 0]) < 0"),
      'Has no upper limit for >=',
    ],
    [
      range.replace("if (operator === '') return compare(v, base) === 0", "if (operator === '') return compare(v, base) >= 0"),
      'Matches an exact version only',
    ],
    [
      range.replace(
        "const parse = (text: string) => text.split('.').map(Number)",
        "const parse = (text: string) => text.split('.') as any",
      ),
      'Compares the example as numbers',
    ],
  ])
})

test('D4 pipeline checks catch wave, loop, hashing, fallback, timing, and propagation mistakes', async () => {
  const waves = solution('devops-job-waves')
  await assertCaught('devops-job-waves', [
    [
      waves.replace(
        '    const wave = left.filter(job => job.needs.every(need => placed.has(need))).map(job => job.name)\n',
        '    const wave: string[] = []\n    for (const job of left) if (job.needs.every(need => placed.has(need))) {\n      wave.push(job.name)\n      placed.add(job.name)\n    }\n',
      ),
      'Waits for the slower branch of a diamond',
    ],
    [
      waves.replace(
        "if (!wave.length) return { ok: false, error: 'CYCLE', jobs: left.map(job => job.name) }",
        "if (!wave.length) return { ok: false, error: 'CYCLE', jobs: left.filter(job => job.needs.length).map(job => job.name).slice(1) }",
      ),
      'Includes jobs that wait on a loop',
    ],
    [
      waves.replace("    if (need !== undefined) return { ok: false, error: 'UNKNOWN_NEED', job: job.name, need }\n", ''),
      'Checks needs before loops',
    ],
    [
      waves.replace(
        'const need = job.needs.find(item => !names.has(item))',
        'const need = [...job.needs].reverse().find(item => !names.has(item))',
      ),
      'Reports the first unknown need',
    ],
    [
      waves.replace('.map(job => job.name)\n    if (!wave.length)', '.map(job => job.name).sort()\n    if (!wave.length)'),
      'Keeps file order within a wave',
    ],
  ])
  const key = solution('devops-cache-key')
  await assertCaught('devops-cache-key', [
    [key.replace('[...new Set(keyFiles)]\n    .sort()', '[...new Set(keyFiles)]'), 'Builds the example key'],
    [key.replace('[...new Set(keyFiles)]', 'keyFiles.slice()'), 'Ignores the order and repeats of key files'],
    [key.replace(".padStart(8, '0')", ''), 'Pads the hash with leading zeros'],
    [
      key.replace("Object.hasOwn(files, path) ? files[path] : '<missing>'", "files[path] || '<missing>'"),
      'Tells an empty file from a missing one',
    ],
    [
      key.replace("path => path + '\\n' + (", 'path => (').replace("'<missing>') + '\\n')", "'<missing>'))"),
      'Includes the path in the hash',
    ],
    [
      key.replace(
        'hash = Math.imul(hash ^ text.charCodeAt(index), 16777619) >>> 0',
        'hash = (Math.imul(hash, 16777619) ^ text.charCodeAt(index)) >>> 0',
      ),
      'Builds the example key',
    ],
    [key.replace("return job + '-' + os + '-' +", "return job + '-' +"), 'Puts the operating system in the key'],
  ])
  const restore = solution('devops-cache-restore')
  await assertCaught('devops-cache-restore', [
    [restore.replace("  if (caches.some(cache => cache.key === key)) return { hit: 'exact', key }\n", ''), 'Prefers an exact match'],
    [restore.replace('cache.createdAt > best.createdAt', 'cache.createdAt >= best.createdAt'), 'Keeps the earlier cache on a tie'],
    [
      restore
        .replace(
          '  for (const prefix of restoreKeys) {\n    let best',
          '  let best: { key: string; createdAt: number } | undefined\n  for (const prefix of restoreKeys) {\n    let unused',
        )
        .replace(
          "    if (best) return { hit: 'partial', key: best.key }\n  }\n",
          "  }\n  if (best) return { hit: 'partial', key: best.key }\n",
        ),
      'Uses the first prefix that matches',
    ],
    [restore.replace('cache.key.startsWith(prefix)', 'cache.key.includes(prefix)'), 'Matches prefixes from the start only'],
    [restore.replace('(!best || cache.createdAt > best.createdAt)', '!best'), 'Restores the newest partial match in the example'],
  ])
  const timing = solution('devops-pipeline-duration')
  await assertCaught('devops-pipeline-duration', [
    [timing.replace('Math.max(0, ...job.needs.map(finishOf)) + job.minutes', 'job.minutes'), 'Times the example'],
    [
      timing.replace('Math.max(0, ...job.needs.map(finishOf))', 'job.needs.map(finishOf).reduce((sum, value) => sum + value, 0)'),
      'Waits for the slowest need',
    ],
    [timing.replace('latest(jobs.map(job => job.name))', 'jobs[jobs.length - 1].name'), 'Ends at the job that finishes last'],
    [
      timing.replace('(finish[name] > finish[best] ? name : best)', '(finish[name] >= finish[best] ? name : best)'),
      'Breaks a tie between last jobs by list order',
    ],
    [
      timing.replace('(finish[name] > finish[best] ? name : best)', '(finish[name] >= finish[best] ? name : best)'),
      'Breaks a tie between needs by needs order',
    ],
    [timing.replace('criticalPath: criticalPath.reverse()', 'criticalPath'), 'Follows a long chain listed backwards'],
    [timing.replace('total: Math.max(0, ...Object.values(finish))', 'total: Math.max(...Object.values(finish))'), 'Handles no jobs'],
  ])
  const skip = solution('devops-skip-unchanged')
  await assertCaught('devops-skip-unchanged', [
    [skip.replace(' || job.needs.some(runs)', ''), 'Runs the example'],
    [
      skip.replace(
        "path.endsWith('/') ? file.startsWith(path) : file === path",
        "path.endsWith('/') ? file.includes(path) : file === path",
      ),
      'Matches a folder only at the start',
    ],
    [skip.replace("path.endsWith('/') ? file.startsWith(path) : file === path", 'file.startsWith(path)'), 'Matches a file path exactly'],
    [
      skip.replace("path.endsWith('/') ? file.startsWith(path) : file === path", 'file.toLowerCase().startsWith(path.toLowerCase())'),
      'Compares letter case exactly',
    ],
    [
      skip.replace('job.needs.some(runs)', 'job.needs.some(need => job.paths.length > 0 && decided.get(need) === true)'),
      'Passes a run through a chain listed backwards',
    ],
    [skip.replace('job.needs.some(runs)', 'job.needs.every(runs) && job.needs.length > 0'), 'Runs a job when any one of its needs runs'],
  ])
})

test('D5 container checks catch propagation, matching, tag, ignore-order, retention, and stage mistakes', async () => {
  const layers = solution('devops-layer-rebuild')
  await assertCaught('devops-layer-rebuild', [
    [layers.replace('    if (!rebuilding) rebuilding =', '    rebuilding ='), 'Rebuilds from the copied source in the example'],
    [layers.replace("source === '.' || ", ''), 'Copies everything with "."'],
    [
      layers.replace(
        "source.endsWith('/') ? file.startsWith(source) : file === source",
        "source.endsWith('/') ? file.includes(source) : file === source",
      ),
      'Matches a folder only from the start of a path',
    ],
    [
      layers.replace("source.endsWith('/') ? file.startsWith(source) : file === source", 'file.startsWith(source)'),
      'Matches a file exactly',
    ],
    [layers.replace('step.copies.some(source =>', 'step.copies.slice(0, 1).some(source =>'), 'Checks every source of a step'],
  ])
  const tags = solution('devops-image-tags')
  await assertCaught('devops-image-tags', [
    [tags.replace("    if (branch === 'main') return ['main', 'edge', shaTag]\n", ''), 'Tags main as edge'],
    [
      tags.replace(
        "if (pre) return [major + '.' + minor + '.' + patch + pre, shaTag]",
        "if (pre) return [major + '.' + minor + '.' + patch + pre, 'latest', shaTag]",
      ),
      'Gives a pre-release only its version',
    ],
    [tags.replace('/^v?(\\d+)', '/^v(\\d+)'), 'Accepts a version without v'],
    [
      tags.replace(
        ".replace(/[^a-z0-9._-]/g, '-')\n      .replace(/^[.-]+/, '')",
        ".replace(/^[.-]+/, '')\n      .replace(/[^a-z0-9._-]/g, '-')",
      ),
      'Removes leading characters after replacing',
    ],
    [tags.replace('.slice(0, 40)', ''), 'Keeps at most 40 characters'],
    [tags.replace('      .toLowerCase()\n', '\n'), 'Converts a feature branch'],
    [tags.replace('/[^a-z0-9._-]/g', '/[^a-z0-9-]/g'), 'Keeps dots and underscores'],
    [
      tags.replace('return name ? [name, shaTag] : [shaTag]\n  }\n  const tag', 'return [name, shaTag]\n  }\n  const tag'),
      'Gives only the sha tag for an empty name',
    ],
    [tags.replace("const shaTag = 'sha-' + sha.slice(0, 7)", "const shaTag = 'sha-' + sha.slice(0, 8)"), 'Tags the release in the example'],
    [
      tags.replace(
        "  if (ref.startsWith('refs/heads/')) {",
        "  const versionLike = /^v?\\d+\\.\\d+\\.\\d+$/.exec(ref.split('/').pop()!)\n  if (versionLike) {\n    const [major, minor, patch] = versionLike[0].replace('v', '').split('.')\n    return [major + '.' + minor + '.' + patch, major + '.' + minor, major, 'latest', 'sha-' + sha.slice(0, 7)]\n  }\n  if (ref.startsWith('refs/heads/')) {",
      ),
      'Treats a branch named like a version as a branch',
    ],
  ])
  const ignore = solution('devops-dockerignore')
  await assertCaught('devops-dockerignore', [
    [
      ignore.replace(
        'for (const rule of rules) if (matches(rule.pattern, path)) keep = rule.keep',
        'for (const rule of rules) if (matches(rule.pattern, path)) {\n      keep = rule.keep\n      break\n    }',
      ),
      'Filters the example',
    ],
    [
      ignore.replace("return path === pattern || path.startsWith(pattern + '/')", 'return path.startsWith(pattern)'),
      'Matches a name as a folder but not as a prefix',
    ],
    [
      ignore.replace(
        "if (pattern.endsWith('/')) return path.startsWith(pattern)",
        "if (pattern.endsWith('/')) return path.includes(pattern)",
      ),
      'Matches a folder pattern from the start',
    ],
    [
      ignore.replace(
        "path.slice(path.lastIndexOf('/') + 1).endsWith(pattern.slice(1))",
        'path === pattern.slice(2) || path.endsWith(pattern.slice(2))',
      ),
      'Matches *.ext in any folder',
    ],
    [
      ignore.replace(".filter(line => line !== '' && !line.startsWith('#'))", ".filter(line => line !== '')"),
      'Skips comments and blank lines',
    ],
    [ignore.replace('.map(line => line.trim())\n', ''), 'Trims lines'],
    [ignore.replace('{ pattern: line.slice(1), keep: true }', '{ pattern: line, keep: true }'), 'Filters the example'],
  ])
  const cleanup = solution('devops-tag-cleanup')
  await assertCaught('devops-tag-cleanup', [
    [cleanup.replace('deployed.includes(name) || ', ''), 'Never deletes a deployed tag'],
    [
      cleanup
        .replace('    if (isProtected(tag.name)) continue\n', '')
        .replace(
          'for (const tag of newestFirst.slice(keepPerBranch)) doomed.add(tag.name)',
          'for (const tag of newestFirst.slice(keepPerBranch)) if (!isProtected(tag.name)) doomed.add(tag.name)',
        ),
      'Keeps the allowance for unprotected tags',
    ],
    [
      cleanup.replace('const newestFirst = [...group].sort((a, b) => b.pushedAt - a.pushedAt)', 'const newestFirst = [...group].reverse()'),
      'Uses push time, not list order',
    ],
    [
      cleanup.replace('[...group].sort((a, b) => b.pushedAt - a.pushedAt)', '[...group].sort((a, b) => a.pushedAt - b.pushedAt).reverse()'),
      'Treats the earlier tag as newer on a tie',
    ],
    [cleanup.replace('/^\\d+\\.\\d+\\.\\d+$/', '/^v?\\d+(\\.\\d+)*$/'), 'Protects only the exact version form'],
    [
      cleanup.replace('byBranch.set(tag.branch,', "byBranch.set('all',").replace('byBranch.get(tag.branch)', "byBranch.get('all')"),
      'Counts branches separately',
    ],
  ])
  const stages = solution('devops-multistage-rebuild')
  await assertCaught('devops-multistage-rebuild', [
    [
      stages.replace('let rebuilding = changedStages.has(stage.from)', 'let rebuilding = false'),
      'Rebuilds a stage that starts from a changed stage',
    ],
    [
      stages.replace(
        'step.fromStage !== undefined\n            ? changedStages.has(step.fromStage)\n            : step.copies',
        'step.copies',
      ),
      'Ignores changed files for a copy from a stage',
    ],
    [stages.replace('? changedStages.has(step.fromStage)', '? false'), 'Rebuilds from the source change in the example'],
    [
      stages.replace(
        '    if (rebuilding) changedStages.add(stage.name)',
        "    if (result[stage.name].includes('rebuilt')) changedStages.add(stage.name)",
      ),
      'Passes a change through a stage with no steps',
    ],
    [
      stages.replace('? changedStages.has(step.fromStage)', '? changedStages.size > 0'),
      'Keeps a stage cached when the stage it copies from did not change',
    ],
  ])
})

test('D6 deploy checks catch rounding, hashing, switch, pause, and verdict mistakes', async () => {
  const rolling = solution('devops-rolling-batches')
  await assertCaught('devops-rolling-batches', [
    [rolling.replace('Math.max(1, Math.floor(', 'Math.max(1, Math.round('), 'Rounds the batch down'],
    [
      rolling.replace(
        'Math.max(1, Math.floor((instances.length * maxUnavailablePercent) / 100))',
        'Math.floor((instances.length * maxUnavailablePercent) / 100) || instances.length',
      ),
      'Updates at least one at a time',
    ],
    [rolling.replace('minAvailable: instances.length - batchSize', 'minAvailable: instances.length - batches.length'), 'Plans the example'],
    [
      rolling.replace('instances.slice(start, start + batchSize)', '[...instances].sort().slice(start, start + batchSize)'),
      'Keeps the given order',
    ],
    [
      rolling.replace(
        'Math.max(1, Math.floor((instances.length * maxUnavailablePercent) / 100))',
        'Math.max(1, Math.ceil((instances.length * maxUnavailablePercent) / 100))',
      ),
      'Plans the example',
    ],
  ])
  const rollout = solution('devops-percent-rollout')
  await assertCaught('devops-percent-rollout', [
    [rollout.replace("const text = flag + ':' + userId", 'const text = userId'), 'Gives each flag its own buckets'],
    [rollout.replace("const text = flag + ':' + userId", 'const text = flag + userId'), 'Joins the flag and user with ":"'],
    [rollout.replace('enabled: bucket < percent', 'enabled: bucket <= percent'), 'Leaves out a bucket equal to the percent'],
    [rollout.replace(' >>> 0\n', ' | 0\n'), 'Enables the user in the example'],
    [rollout.replace("const text = flag + ':' + userId", "const text = flag + ':' + userId.toLowerCase()"), 'Compares user IDs exactly'],
    [rollout.replace('const bucket = hash % 100', 'const bucket = hash % 101'), 'Leaves out a user above the percent'],
  ])
  const blueGreen = solution('devops-blue-green')
  await assertCaught('devops-blue-green', [
    [
      blueGreen.replace(
        "if (idleHealth !== 'healthy' || versions[idle()] === null) refused.push(index)",
        'if (versions[idle()] === null) refused.push(index)',
      ),
      'Refuses to switch before a check',
    ],
    [
      blueGreen.replace("      idleHealth = 'unchecked'\n      target = null\n", "      idleHealth = 'unchecked'\n"),
      'Clears the rollback target on a new deploy',
    ],
    [
      blueGreen.replace("      idleHealth = 'failed'\n      target = null\n", "      idleHealth = 'healthy'\n      target = null\n"),
      'Refuses to switch back to a rolled-back color',
    ],
    [
      blueGreen.replace('      if (versions[idle()] === null) refused.push(index)\n      else idleHealth', '      idleHealth'),
      'Refuses a check with nothing deployed',
    ],
    [
      blueGreen.replace(
        '    } else if (target === null) refused.push(index)\n    else {\n      live = target',
        '    } else {\n      live = target ?? idle()',
      ),
      'Refuses a rollback with no target',
    ],
    [
      blueGreen.replace('        target = live\n        live = idle()\n', '        live = idle()\n        target = live\n'),
      'Rolls back to the previous live color',
    ],
  ])
  const schedule = solution('devops-canary-schedule')
  await assertCaught('devops-canary-schedule', [
    [
      schedule.replace('const active = minutesSinceStart - paused', 'const active = minutesSinceStart'),
      'Places the example after its pause',
    ],
    [schedule.replace('Math.min(pause.to, minutesSinceStart)', 'pause.to'), 'Counts an unfinished pause only up to now'],
    [
      schedule.replace('Math.max(0, Math.min(pause.to, minutesSinceStart) - Math.max(pause.from, 0))', '(pause.to - pause.from)'),
      'Ignores a pause that has not started',
    ],
    [schedule.replace('if (start > active) break', 'if (start >= active) break'), 'Starts a step exactly when the holds are over'],
    [
      schedule.replace('if (start > active) break', 'if (start + steps[index].holdMinutes > active) break'),
      'Places the example after its pause',
    ],
    [schedule.replace('index < steps.length', 'index < steps.length - 1'), 'Stays on the last step'],
    [
      schedule.replace(
        'if (start > active) break\n    current = index\n    start += steps[index].holdMinutes',
        'start += steps[index].holdMinutes\n    if (start > active) break\n    current = index',
      ),
      'Starts a step exactly when the holds are over',
    ],
  ])
  const verdict = solution('devops-canary-verdict')
  await assertCaught('devops-canary-verdict', [
    [
      verdict.replace('if (errors * 100 > policy.maxErrorPercent * requests)', 'if ((errors / requests) * 100 > policy.maxErrorPercent)'),
      'Uses whole-number arithmetic at the boundary',
    ],
    [
      verdict.replace('if (errors * 100 > policy.maxErrorPercent * requests)', 'if (errors * 100 >= policy.maxErrorPercent * requests)'),
      'Counts a rate at the limit as healthy',
    ],
    [verdict.replace('    if (requests < policy.minRequests) continue\n', ''), 'Does not judge a quiet minute full of errors'],
    [
      verdict.replace(
        '    if (requests < policy.minRequests) continue\n',
        '    if (requests < policy.minRequests) {\n      healthy = 0\n      unhealthy = 0\n      continue\n    }\n',
      ),
      'Skips quiet minutes without breaking a run',
    ],
    [
      verdict.replace('      unhealthy++\n      healthy = 0\n', '      unhealthy++\n'),
      'Restarts the healthy run after an unhealthy minute',
    ],
    [verdict.replace('      healthy++\n      unhealthy = 0\n', '      healthy++\n'), 'Resets a run when the other kind appears'],
    [verdict.replace('policy.maxErrorPercent * requests', '2 * requests'), 'Uses the supplied limits'],
  ])
})

test('D7 health checks catch signal, run, backoff, timing, and drain mistakes', async () => {
  const endpoints = solution('devops-health-endpoints')
  await assertCaught('devops-health-endpoints', [
    [
      endpoints.replace('live: { status: state.stalled ? 503 : 200 }', 'live: { status: state.stalled || reasons.length ? 503 : 200 }'),
      'Stays live while the database is down',
    ],
    [
      endpoints.replace('if (dependency.required && !dependency.up)', 'if (!dependency.up)'),
      'Is ready when every required dependency is up',
    ],
    [endpoints.replace("  if (state.shuttingDown) reasons.push('shutting down')\n", ''), 'Is not ready while shutting down'],
    [endpoints.replace("  if (!state.started) reasons.push('starting')\n", ''), 'Is not ready while starting'],
    [
      endpoints.replace(
        'ready: { status: reasons.length ? 503 : 200, reasons }',
        'ready: { status: reasons.length || state.stalled ? 503 : 200, reasons }',
      ),
      'Fails liveness only when stalled',
    ],
    [
      endpoints
        .replace("  if (!state.started) reasons.push('starting')\n", '')
        .replace("dependency.name + ' is down')\n", "dependency.name + ' is down')\n  if (!state.started) reasons.push('starting')\n"),
      'Lists every reason in order',
    ],
  ])
  const timeline = solution('devops-probe-thresholds')
  await assertCaught('devops-probe-thresholds', [
    [timeline.replace('let inService = false', 'let inService = true'), 'Starts out of service'],
    [timeline.replace('      passes++\n      failures = 0\n', '      passes++\n'), 'Stays in service through a short failure'],
    [timeline.replace('      failures++\n      passes = 0\n', '      failures++\n'), 'Follows the example'],
    [timeline.replace('passes >= healthyThreshold', 'passes > healthyThreshold'), 'Enters service at the threshold'],
    [timeline.replace('failures >= unhealthyThreshold', 'failures > unhealthyThreshold'), 'Leaves service at the threshold'],
    [
      timeline.replace(
        'if (inService && failures >= unhealthyThreshold) inService = false',
        'if (failures >= unhealthyThreshold) {\n        inService = false\n        passes = -healthyThreshold\n      }',
      ),
      'Ignores failures while out of service',
    ],
  ])
  const backoff = solution('devops-restart-backoff')
  await assertCaught('devops-restart-backoff', [
    [
      backoff.replace('Math.min(policy.maxSeconds, policy.baseSeconds * 2 ** crashes)', 'policy.baseSeconds * 2 ** crashes'),
      'Stops at the limit',
    ],
    [backoff.replace('    if (seconds >= policy.resetAfterSeconds) crashes = 0\n', ''), 'Doubles and resets as in the example'],
    [backoff.replace('seconds >= policy.resetAfterSeconds', 'seconds > policy.resetAfterSeconds'), 'Resets at exactly the reset time'],
    [
      backoff.replace(
        '    if (seconds >= policy.resetAfterSeconds) crashes = 0\n    const delay = Math.min(policy.maxSeconds, policy.baseSeconds * 2 ** crashes)\n',
        '    const delay = Math.min(policy.maxSeconds, policy.baseSeconds * 2 ** crashes)\n    if (seconds >= policy.resetAfterSeconds) crashes = -1\n',
      ),
      'Doubles and resets as in the example',
    ],
    [
      backoff.replace('policy.baseSeconds * 2 ** crashes', '10 * 2 ** crashes').replace('Math.min(policy.maxSeconds,', 'Math.min(300,'),
      'Uses the supplied policy',
    ],
  ])
  const liveness = solution('devops-liveness-restart')
  await assertCaught('devops-liveness-restart', [
    [liveness.replace('t < stall.to', 't <= stall.to'), 'Passes a check exactly at the end of a stall'],
    [liveness.replace('stall.from <= t', 'stall.from < t'), 'Fails a check exactly at the start of a stall'],
    [liveness.replace('    } else failures = 0\n', '    }\n'), 'Resets the count after a pass'],
    [liveness.replace('t <= horizon', 't < horizon'), 'Counts a check at the horizon'],
    [liveness.replace('let t = probe.initialDelay', 'let t = 0'), 'Waits long enough for the start'],
    [liveness.replace('failures >= probe.failureThreshold', 'failures > probe.failureThreshold'), 'Restarts a slow start in the example'],
  ])
  const drain = solution('devops-graceful-drain')
  await assertCaught('devops-graceful-drain', [
    [drain.replace('const stopAccepting = shutdownAt + policy.acceptForSeconds', 'const stopAccepting = shutdownAt'), 'Drains the example'],
    [drain.replace('request.arrives >= stopAccepting', 'request.arrives > stopAccepting'), 'Rejects a request when accepting has stopped'],
    [drain.replace('request.finishes <= deadline', 'request.finishes < deadline'), 'Completes a request that finishes at the deadline'],
    [drain.replace('let busyUntil = stopAccepting', 'let busyUntil = shutdownAt'), 'Waits until accepting stops even when idle'],
    [drain.replace('exitAt: Math.min(deadline, busyUntil)', 'exitAt: deadline'), 'Exits when the last request finishes'],
    [
      drain.replace(
        '    else cutOff.push(request.id)\n    busyUntil = Math.max(busyUntil, request.finishes)\n',
        '    else {\n      cutOff.push(request.id)\n      continue\n    }\n    busyUntil = Math.max(busyUntil, request.finishes)\n',
      ),
      'Drains the example',
    ],
    [drain.replace('exitAt: Math.min(deadline, busyUntil)', 'exitAt: busyUntil'), 'Sorts each id into one list in request order'],
  ])
})

test('D8 schedule checks catch field, day-rule, zone, start, and clock-change mistakes', async () => {
  const field = solution('devops-cron-field')
  await assertCaught('devops-cron-field', [
    [
      field.replace("const start = base === '*' ? min : Number(first)", "const start = base === '*' ? 0 : Number(first)"),
      'Starts a step from min',
    ],
    [
      field.replace("    if (stepText !== undefined && base !== '*' && last === undefined) return null\n", ''),
      'Refuses a step after a single number',
    ],
    // A step of 0 would loop forever, so this mutant skips the part instead of refusing the field.
    [field.replace(' || step < 1) return null', ') return null\n    if (step < 1) continue'), 'Refuses a step of 0'],
    [field.replace(' || start > end', ''), 'Refuses a backwards range'],
    [field.replace('end > max || ', ''), 'Refuses a range that ends out of range'],
    [field.replace('return [...values].sort((a, b) => a - b)', 'return [...values]'), 'Sorts a list and removes repeats'],
    [field.replace("field.split(',')", "field.split(',').filter(part => part !== '')"), 'Refuses an empty part'],
  ])
  const matches = solution('devops-cron-matches')
  await assertCaught('devops-cron-matches', [
    [
      matches.replace("!dom.startsWith('*') && !dow.startsWith('*') ? domOk || dowOk : domOk && dowOk", 'domOk && dowOk'),
      'Matches either day when both are restricted',
    ],
    [
      matches.replace(
        "!dom.startsWith('*') && !dow.startsWith('*') ? domOk || dowOk : domOk && dowOk",
        "dom !== '*' && dow !== '*' ? domOk || dowOk : domOk && dowOk",
      ),
      'Needs both days when one starts with "*"',
    ],
    [matches.replace('.map(day => day % 7)', ''), 'Treats 7 as Sunday'],
    [matches.replace(' && expand(month, 1, 12).has(time.month)', ''), 'Checks the month'],
    [matches.replace('value += stepText ? Number(stepText) : 1', 'value += 1'), 'Refuses a minute between steps'],
  ])
  const toUtc = solution('devops-local-to-utc')
  await assertCaught('devops-local-to-utc', [
    [toUtc.replace('[-86400000, 0, 86400000]', '[0]'), 'Reports a time repeated in autumn'],
    [toUtc.replace('    .filter(instant => wall(instant) === target)\n', ''), 'Reports a time skipped in spring'],
    [toUtc.replace('timeZone: zone, ', ''), 'Converts a summer time'],
    [toUtc.replace('    .sort((a, b) => a - b)\n', '    .sort((a, b) => b - a)\n'), 'Reports a time repeated in autumn'],
    [toUtc.replace("hourCycle: 'h23', ", 'hour12: true, '), 'Crosses the date line'],
  ])
  const utc = solution('devops-cron-next-utc')
  await assertCaught('devops-cron-next-utc', [
    [
      utc.replace(
        'const start = Math.floor(Date.parse(after) / 60000) * 60000 + 60000',
        'const start = Math.floor(Date.parse(after) / 60000) * 60000',
      ),
      'Never returns after itself',
    ],
    [
      utc.replace(
        'const start = Math.floor(Date.parse(after) / 60000) * 60000 + 60000',
        'const start = Math.ceil(Date.parse(after) / 60000) * 60000',
      ),
      'Never returns after itself',
    ],
    [
      utc.replace('const limit = Date.parse(after) + 366 * 86400000', 'const limit = Date.parse(after) + 4 * 366 * 86400000'),
      'Returns null beyond 366 days',
    ],
    [utc.replace('either ? domOk || dowOk : domOk && dowOk', 'domOk && dowOk'), 'Uses either day field when both are set'],
    [utc.replace('.map(day => day % 7)', ''), 'Treats 7 as Sunday'],
    [
      utc.replace('d.getUTCDay()', 'd.getDay()').replace('d.getUTCDate()', 'd.getDate()').replace('d.getUTCHours()', 'd.getHours()'),
      'Skips the weekend in the example',
    ],
  ])
  const zone = solution('devops-cron-next-zone')
  await assertCaught('devops-cron-next-zone', [
    [zone.replace('      .sort((a, b) => a - b)[0]', '      .sort((a, b) => b - a)[0]'), 'Runs at the first of two repeated times'],
    [
      zone.replace('.sort((a, b) => a - b)[0]', '.find(instant => instant > from) ?? undefined'),
      'Knows the repeat already ran before after',
    ],
    [
      zone.replace('const limit = from + 8 * 86400000', 'const limit = from + 40 * 86400000').replace('offset <= 9', 'offset <= 41'),
      'Returns null beyond 8 days',
    ],
    [zone.replace('instant > from', 'instant >= from'), 'Never returns after itself'],
    [zone.replace('timeZone: zone, ', "timeZone: 'UTC', "), 'Runs on a half-hour offset'],
    [
      zone
        .replace('const today = fields(from)', 'const today = new Date(from)')
        .replace(
          'Date.UTC(today.year, today.month - 1, today.day + offset)',
          'Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset)',
        ),
      'Starts from the local date of after',
    ],
  ])
  // The approach the hints describe, stepping minute by minute from a day before after, satisfies the same contract.
  const stepping = `
function nextRun(expression: string, after: string, zone: string): string | null {
  const expand = (field: string, min: number, max: number) => {
    const values = new Set<number>()
    for (const part of field.split(',')) {
      const [range, step] = part.split('/')
      const [low, high] = range === '*' ? [min, max] : range.split('-').map(Number)
      const end = range === '*' || range.includes('-') ? high : low
      for (let v = low; v <= end; v += step ? Number(step) : 1) values.add(v)
    }
    return values
  }
  const [mi, ho, dm, mo, dw] = expression.split(' ')
  const minutes = expand(mi, 0, 59), hours = expand(ho, 0, 23), doms = expand(dm, 1, 31), months = expand(mo, 1, 12)
  const dows = new Set([...expand(dw, 0, 7)].map(d => d % 7))
  const either = !dm.startsWith('*') && !dw.startsWith('*')
  const format = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
  const from = Date.parse(after)
  let seen = -Infinity
  for (let t = Math.floor(from / 60000) * 60000 - 86400000; t <= from + 8 * 86400000; t += 60000) {
    const p: Record<string, number> = {}
    for (const part of format.formatToParts(new Date(t))) if (part.type !== 'literal') p[part.type] = Number(part.value)
    const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
    const repeat = wall <= seen
    seen = Math.max(seen, wall)
    if (t <= from || repeat) continue
    const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()
    const dayOk = either ? doms.has(p.day) || dows.has(weekday) : doms.has(p.day) && dows.has(weekday)
    if (months.has(p.month) && dayOk && hours.has(p.hour) && minutes.has(p.minute)) return new Date(t).toISOString()
  }
  return null
}`
  assert.deepEqual(await failed('devops-cron-next-zone', stepping), [])
})
