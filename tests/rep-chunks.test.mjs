import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { renderRepChunks } from '../scripts/catalog-index.mjs'
import { repSourceLoaders } from '../src/rep-chunks.ts'
import { repSources } from '../src/rep-sources.ts'

test('the generated rep chunk loaders match src/rep-sources.ts', () => {
  assert.equal(
    readFileSync(new URL('../src/rep-chunks.ts', import.meta.url), 'utf8'),
    renderRepChunks(),
    'Run `yarn content:index` and commit src/rep-chunks.ts.',
  )
})

test('each lazy loader returns the same reps and lessons as its static source', async () => {
  assert.deepEqual(
    Object.keys(repSourceLoaders),
    repSources.map(source => source.name),
  )
  for (const source of repSources) {
    const loader = repSourceLoaders[source.name]
    const picked = loader.pick(await loader.load())
    assert.equal(picked.reps, source.reps, source.name)
    assert.equal(picked.lessons, source.lessons, source.name)
  }
})
