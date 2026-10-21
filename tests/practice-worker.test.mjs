import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const importsOf = async file =>
  [...(await readFile(file, 'utf8')).matchAll(/from '([^']+)'|import\('([^']+)'\)/g)].map(match => match[1] ?? match[2])

test('the practice worker loads one rep source instead of the whole catalog', async () => {
  const imports = await importsOf('src/runner.worker.ts')
  assert.ok(imports.includes('./rep-chunks.ts'))
  for (const whole of ['./rep.ts', './rep', './runner', './runner.ts', './rep-sources.ts', './catalog-index.ts', './rep-content.ts'])
    assert.ok(!imports.includes(whole), `runner.worker.ts must not import ${whole}`)
  assert.ok(!(await importsOf('src/run-rep.ts')).some(name => /^\.\/rep(\.ts|-sources\.ts)?$/.test(name)))
})

test('frontend previews and checks never load the compiler on the page', async () => {
  for (const file of ['src/FrontendPreview.tsx', 'src/frontend-run.ts', 'src/frontend-frame-html.ts', 'src/practice-worker.ts']) {
    const imports = await importsOf(file)
    for (const compiler of ['./compile-solution', './compile-solution.ts', './frontend-frame', './frontend-frame.ts', 'typescript'])
      assert.ok(!imports.includes(compiler), `${file} must not import ${compiler}`)
  }
})
