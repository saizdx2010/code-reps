import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { renderCatalogIndex } from '../scripts/catalog-index.mjs'
import { foundationRepIds, repIndex, skillIndex } from '../src/catalog-index.ts'
import { loadAllReps, loadRepContent } from '../src/rep-content.ts'
import { skills } from '../src/knowledge.ts'
import { reps } from '../src/rep.ts'

test('the generated catalog index matches the authored reps and lessons', () => {
  assert.equal(readFileSync(new URL('../src/catalog-index.ts', import.meta.url), 'utf8'), renderCatalogIndex(), 'Run `yarn content:index` and commit src/catalog-index.ts.')
})

test('the index lists every rep and skill in catalog order with stable ids', () => {
  assert.deepEqual(repIndex.map(item => item.id), reps.map(rep => rep.id))
  assert.deepEqual(skillIndex.map(skill => skill.id), skills.map(skill => skill.id))
  for (const [position, item] of repIndex.entries()) {
    const rep = reps[position]
    assert.deepEqual([item.title, item.category, item.format, item.starter, item.hintTotal], [rep.title, rep.category, rep.format, rep.starter, rep.hints.length])
  }
  for (const [position, summary] of skillIndex.entries()) {
    const skill = skills[position]
    assert.deepEqual(summary.questions.map(question => [question.id, question.answer, question.optionCount]), skill.questions.map(question => [question.id, question.answer, question.options.length]))
    assert.deepEqual([summary.title, summary.prerequisites, summary.related, summary.repIds, summary.firstMistake], [skill.title, skill.prerequisites, skill.related, skill.repIds, skill.mistakes[0]])
  }
  assert.ok(foundationRepIds.length > 0 && foundationRepIds.every(id => repIndex.some(item => item.id === id)))
})

test('loading a rep returns the same authored content the full catalog holds', async () => {
  for (const rep of reps) assert.equal((await loadRepContent(rep.id)).rep, reps.find(item => item.id === rep.id), rep.id)
  assert.deepEqual((await loadAllReps()).map(rep => rep.id), reps.map(rep => rep.id))
  const lesson = await loadRepContent(foundationRepIds[0])
  assert.equal(lesson.lesson?.repId, foundationRepIds[0])
  await assert.rejects(loadRepContent('not-a-rep'), /Unknown rep/)
})

// The startup bundle must not pull rep or lesson content back in through a static import.
test('startup modules never statically import heavy content', () => {
  const heavy = /^(rep|rep-sources|knowledge|knowledge-validation|foundations|practical-concepts|dsa-knowledge|rep-depth|lesson-depth|reflection-guides|runner|review-[a-z-]+|[a-z-]+-reps)$/
  const resolve = (from, specifier) => ['.ts', '.tsx'].map(ext => join(dirname(from), specifier + ext)).concat(join(dirname(from), specifier)).find(file => existsSync(file) && /\.tsx?$/.test(file))
  const root = new URL('../src/main.tsx', import.meta.url).pathname
  const seen = new Set()
  const offenders = []
  const visit = file => {
    if (seen.has(file)) return
    seen.add(file)
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/^(?:import|export)\s[^'"\n]*?from\s+['"](\.[^'"]+)['"]|^import\s+['"](\.[^'"]+)['"]/gm)) {
      if (/^import\s+type\b|^export\s+type\b/.test(match[0])) continue
      const specifier = (match[1] ?? match[2]).replace(/\.(tsx?|css)$/, '')
      if ((match[1] ?? match[2]).endsWith('.css')) continue
      const target = resolve(file, specifier)
      if (!target) continue
      const name = target.split('/').pop().replace(/\.tsx?$/, '')
      if (heavy.test(name)) offenders.push(`${file.split('/src/')[1]} -> ${name}`)
      else visit(target)
    }
  }
  visit(root)
  assert.deepEqual(offenders, [])
})
