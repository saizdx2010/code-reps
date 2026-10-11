// Prints ready-to-paste authoring skeletons for a new rep. Nothing is written: paste each block where the checklist says.
// Usage: yarn rep:new <rep-id> <module-file>   e.g. yarn rep:new sum-evens src/foundations.ts
import { access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
// Lowercase letters and digits joined by single hyphens. A leading letter keeps the derived function name a valid identifier.
const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const modulePattern = /^src\/[a-z0-9-]+\.ts$/

export function validateRepId(id, usedIds) {
  if (!id) return 'Give a rep id, for example: yarn rep:new sum-evens src/foundations.ts'
  if (!idPattern.test(id)) return `"${id}" is not kebab-case. Use lowercase letters and digits joined by single hyphens, starting with a letter (for example sum-evens).`
  if (usedIds.has(id)) return `"${id}" is already used by another rep. Rep IDs are saved keys, so choose a new one.`
  return null
}

export function validateModuleFile(moduleFile) {
  if (!moduleFile) return 'Give the content module, for example: src/foundations.ts'
  if (!modulePattern.test(moduleFile)) return `"${moduleFile}" must be a .ts file directly in src/, for example src/foundations.ts.`
  if (moduleFile.split('/').pop().startsWith('review-')) return `"${moduleFile}" is a review module. Reps go in content modules; review-*.ts files hold depth and self-review guides.`
  return null
}

const camelCase = id => id.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())

export function renderRepSkeleton({ id, moduleFile }) {
  const functionName = camelCase(id)
  const section = (heading, where) => `\n${'='.repeat(72)}\n${heading}\n${where}\n${'='.repeat(72)}\n`
  return [
    section('1. Rep object', `Paste into the rep array exported by ${moduleFile}. Replace every TODO. Optional fields (format, context, acceptanceCriteria, brief, preserveInput, domPreview) are listed in src/rep-types.ts.`),
    `{
  id: '${id}',
  title: 'TODO: short title a new learner can scan',
  category: 'TODO: an existing category name, so the library groups it correctly',
  prompt: 'TODO: full contract: input, output, normalization, precedence, character set, and input limits',
  example: { input: 'TODO', output: 'TODO' },
  note: 'TODO: one plain-language note about the decision this rep teaches',
  vocabulary: [{ term: 'TODO', meaning: 'TODO' }],
  planPrompt: 'TODO: ask the learner to plan in their own words before coding',
  starter: \`function ${functionName}(/* TODO parameters */) {
  // TODO: learner writes the body
  return undefined
}
\`,
  functionName: '${functionName}',
  hints: [
    'TODO: first, general hint',
    'TODO: second hint, still without the full answer',
    'TODO: last hint before the reveal',
  ],
  checks: [
    { name: 'TODO normal case', input: [/* TODO arguments */], expected: /* TODO */ undefined },
    { name: 'TODO boundary case', input: [/* TODO arguments */], expected: /* TODO */ undefined },
  ],
}`,
    section('2. Depth entry', 'Post-attempt review. Add it to the matching src/review-*.ts depth export; src/rep-depth.ts aggregates it. Keep it out of the prompt.'),
    `'${id}': {
  reasoning: 'TODO: why the approach meets the contract (invariant, precedence, or validation argument)',
  trace: 'TODO: follow concrete values through a boundary or conflicting case',
  alternative: 'TODO: a plausible approach and its time, storage, or readability tradeoff',
  counterexample: 'TODO: a tempting mistake and the input that exposes it',
  transfer: 'TODO: an unfamiliar variation and the decision it requires (self-reviewed)',
},`,
    section('3. Self-review guide', 'Paste into src/reflection-guides.ts, or the matching review-*.ts guide export. content:check fails without it.'),
    `'${id}': {
  plan: ['TODO: planning question the learner answers before coding'],
  explanation: ['TODO: explanation question about the decision'],
  example: 'TODO: a short example answer the learner can compare against',
},`,
    section('4. Reference solution', 'Independent implementation for tests/fixtures. Use the fixture file for your module, for example tests/fixtures/foundations-solutions.mjs.'),
    `'${id}': 'TODO: a complete TypeScript function named ${functionName} that passes every check',`,
    section('5. Follow-up checklist', 'Run these after pasting the blocks above.'),
    [
      `- [ ] Add the rep to a stage in src/path.ts if it belongs on a path, and add its level to src/rep-levels.ts ('${id}': 1, 2, or 3).`,
      `- [ ] Gloss every vocabulary term in indonesianGlossary (src/vocabulary-id.ts) using the exact English key. tests/vocabulary-id.test.mjs names any missing gloss.`,
      '- [ ] If the module is new, list it in src/rep-sources.ts and src/rep-content.ts.',
      '- [ ] yarn content:index   (regenerates src/catalog-index.ts; tests/catalog-index.test.mjs fails when it is stale)',
      '- [ ] yarn content:check   (fields, checks, self-review guide, depth, and references)',
      '- [ ] node --experimental-strip-types --test tests/content.test.mjs   (reference solution must pass every check)',
      '- [ ] yarn test, yarn lint, yarn build',
      '- [ ] Read the prompt as someone new to the terminology, then try it with yarn dev.',
    ].join('\n'),
    '',
  ].join('\n')
}

export async function main(argv = process.argv.slice(2)) {
  const [id = '', moduleFile = ''] = argv
  if (argv.length !== 2) {
    console.error('Usage: yarn rep:new <rep-id> <module-file>   e.g. yarn rep:new sum-evens src/foundations.ts')
    return 2
  }
  const { reps } = await import(pathToFileURL(join(root, 'src/rep.ts')).href)
  const idError = validateRepId(id, new Set(reps.map(rep => rep.id)))
  const moduleError = validateModuleFile(moduleFile)
  if (idError || moduleError) {
    console.error([idError, moduleError].filter(Boolean).join('\n'))
    return 1
  }
  try {
    await access(join(root, moduleFile))
  } catch {
    console.error(`"${moduleFile}" does not exist. Pick an existing content module, or create it and register it first.`)
    return 1
  }
  console.log(renderRepSkeleton({ id, moduleFile }))
  return 0
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) process.exitCode = await main()
