import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('inline code uses semantic code elements and escapes all text', async () => {
  const dir = await mkdtemp(join(process.cwd(), 'node_modules/.inline-code-'))
  try {
    const source = await readFile('src/InlineCode.tsx', 'utf8')
    const js = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
    const file = join(dir, 'InlineCode.mjs')
    await writeFile(file, js)
    const { InlineCode } = await import(pathToFileURL(file))
    const render = text => renderToStaticMarkup(createElement(InlineCode, { text }))
    assert.equal(render('Use `form.noValidate` and `aria-invalid`.'), 'Use <code>form.noValidate</code> and <code>aria-invalid</code>.')
    assert.equal(render('<img src=x onerror=alert(1)> `<script>&</script>`'), '&lt;img src=x onerror=alert(1)&gt; <code>&lt;script&gt;&amp;&lt;/script&gt;</code>')
    assert.equal(render('Keep `an unfinished span'), 'Keep `an unfinished span')
    assert.equal(render('Empty `` stays text'), 'Empty `` stays text')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
