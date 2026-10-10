import { expect, test } from '@playwright/test'
import { buildFrontendFrame } from '../../src/frontend-frame'
import { connectedFeatureReps } from '../../src/connected-feature-reps'
import { encodeFiles } from '../../src/project-files'
import { connectedSolutions } from '../fixtures/connected-feature-solutions.mjs'

test('connected multi-file feature checks execute in the real sandbox', async ({ page }) => {
  await page.goto('/')
  for (const [index, rep] of connectedFeatureReps.entries()) {
    if (!rep.domPreview) continue
    const source = buildFrontendFrame(encodeFiles({ entry: 'main.ts', files: connectedSolutions[index] }), rep, 'browser-check', 'checks')
    const report = await page.evaluate(source => new Promise<{ error?: string; results: { passed: boolean; name: string }[] }>(resolve => {
      const frame = document.createElement('iframe')
      frame.sandbox.add('allow-scripts')
      const receive = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow || event.data.token !== 'browser-check') return
        window.removeEventListener('message', receive)
        frame.remove()
        resolve(event.data)
      }
      window.addEventListener('message', receive)
      frame.srcdoc = source
      document.body.append(frame)
    }), source)
    expect(report.error, rep.id).toBeUndefined()
    expect(report.results.filter(result => !result.passed), rep.id).toEqual([])
  }
})

test('a multi-file starter resolves its sibling imports without false editor errors', async ({ page }) => {
  await page.goto('/#/practice/connected-note-render')
  const editor = page.getByRole('textbox', { name: /^TypeScript solution for/ })
  await expect(editor).toBeVisible()
  const importLine = page.locator('.view-line').filter({ hasText: "from './state'" })
  await expect(importLine).toBeVisible()
  // Positive control: the editor reports a real error when one is typed, so the empty result below is meaningful.
  await editor.focus()
  await editor.press('ControlOrMeta+End')
  await editor.pressSequentially('\nconst probe: number = "text"')
  await expect(page.locator('.squiggly-error').first()).toBeVisible({ timeout: 30_000 })
  // Monaco groups typing into several undo steps; undo until the starter text is back, then the import lines must be clean.
  for (let step = 0; step < 40; step++) await editor.press('ControlOrMeta+Z')
  await expect(page.locator('.view-line').filter({ hasText: 'probe' })).toHaveCount(0)
  await expect.poll(() => page.locator('.squiggly-error').count(), { timeout: 30_000 }).toBe(0)
  await expect(importLine.locator('.squiggly-error')).toHaveCount(0)
})

test('scratch note supports keyboard save and recovery on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const rep = connectedFeatureReps[6]
  const preview = { ...rep, domPreview: { ...rep.domPreview!, props: { text: '', raw: '{', failSave: false } } }
  const source = buildFrontendFrame(encodeFiles({ entry: 'main.ts', files: connectedSolutions[6] }), preview, 'preview', 'preview')
  await page.evaluate(source => {
    document.body.replaceChildren()
    const frame = document.createElement('iframe')
    frame.sandbox.add('allow-scripts')
    frame.style.width = '100%'
    frame.style.border = '0'
    frame.srcdoc = source
    document.body.append(frame)
  }, source)
  const frame = page.frameLocator('iframe')
  await expect(frame.getByTestId('status')).toHaveText('Recovered')
  const input = frame.getByLabel('Note', { exact: true })
  await input.fill('Recovered draft')
  await input.press('Tab')
  await expect(frame.getByRole('button', { name: 'Save', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(frame.getByTestId('status')).toHaveText('Saved')
  await input.fill('Unsaved edit')
  await frame.getByRole('button', { name: 'Reload', exact: true }).click()
  await expect(input).toHaveValue('Recovered draft')
  await frame.getByRole('button', { name: 'Test reader', exact: true }).click()
  await expect(frame.getByTestId('report')).toHaveText('All reader cases passed')
})

test('checkpoint files remain playable through Monaco, checks, and draft reload', async ({ page }) => {
  const rep = connectedFeatureReps[3]
  const files = connectedSolutions[3]
  await page.goto('/#/practice/' + rep.id)
  const editor = page.getByRole('textbox', { name: /^TypeScript solution for/ })
  for (const filename of ['main.ts', 'storage.ts']) {
    await page.getByRole('group', { name: 'Project files' }).getByRole('button', { name: filename, exact: filename !== 'main.ts' }).click()
    await expect(editor).toBeVisible()
    await editor.focus()
    await editor.press('ControlOrMeta+A')
    await editor.evaluate((element, text) => {
      const clipboardData = new DataTransfer()
      clipboardData.setData('text/plain', text)
      element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }))
    }, files[filename])
    await expect.poll(() => page.evaluate(({ id, filename }) => Object.entries(localStorage)
      .filter(([key]) => key.includes(id))
      .map(([, value]) => JSON.parse(JSON.parse(value).code).files[filename]), { id: rep.id, filename })).toContain(files[filename])
  }
  await page.locator('.workspace-toolbar').getByRole('button', { name: /Run checks/ }).click()
  await expect(page.getByText('All checks passed', { exact: true })).toBeVisible({ timeout: 30_000 })
  await page.reload()
  await expect(editor).toBeVisible()
  await page.locator('.workspace-toolbar').getByRole('button', { name: /Run checks/ }).click()
  await expect(page.getByText('All checks passed', { exact: true })).toBeVisible({ timeout: 30_000 })
})
