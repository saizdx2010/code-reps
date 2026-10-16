import { expect, test } from '@playwright/test'
import { expectChecksFinished, chooseOption, editor, replaceCode, route, saved, solution } from './helpers'

const endless = 'function mostFrequent(numbers: number[]): number | null { while (true) {} }'

test('local TypeScript assistance and find remain available after editor import narrowing', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, 'function mostFrequent(numbers: number[]): number | null {\n  numbers.\n  return null\n}')
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('End')
  await page.keyboard.press('Control+Space')
  await expect(page.locator('.suggest-widget.visible')).toContainText('filter')
  await page.keyboard.press('Escape')
  await page.keyboard.press('ControlOrMeta+f')
  const find = page.locator('.find-widget').getByRole('textbox', { name: 'Find', exact: true })
  await expect(find).toBeVisible()
  await find.fill('numbers')
  await expect(page.locator('.find-widget .matchesCount')).toContainText('2')
  await find.press('Escape')
  await expect(editor(page)).toBeFocused()
})

test('stopping and editing cancel real worker checks without losing the draft', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, endless)
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await page.getByRole('button', { name: 'Stop checks', exact: true }).click()
  await expect(page.getByText('Checks stopped. Your code is unchanged; run again when you are ready.')).toBeVisible()
  await saved(page)
  await page.reload()
  await expect(editor(page)).toBeVisible()
  await expect(page.locator('.view-lines')).toContainText('while (true)')
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Stop checks', exact: true })).toBeVisible()
  await replaceCode(page, solution)
  await expect(page.getByRole('button', { name: 'Run checks', exact: true })).toBeEnabled()
  // Let the disposed run's original deadline pass. It must not publish feedback.
  await page.waitForTimeout(5_200)
  await expect(page.locator('#checks-section .error-message')).toHaveCount(0)
  await expect(page.getByText('All checks passed', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
})

test('a real worker timeout keeps the code editable and allows another run', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, endless)
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expect(page.getByText('The checks took too long and were stopped. Check for an endless loop, then run again.')).toBeVisible()
  await expect(page.locator('.view-lines')).toContainText('while (true)')
  await expect(page.getByRole('button', { name: 'Run checks', exact: true })).toBeEnabled()
  await replaceCode(page, solution)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
})

test('failed editor loading preserves a saved draft and offers working plain text checks', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, solution)
  await saved(page)
  await page.route('**/src/CodeEditor.tsx*', request => request.abort())
  await page.reload()
  await expect(page.getByText('The code editor could not load.', { exact: false })).toBeVisible()
  const fallback = page.getByLabel('SOLUTION.TS', { exact: true })
  await expect(fallback).toHaveValue(solution)
  await fallback.fill(solution + '\n// Continued in the fallback editor')
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await saved(page)
  await page.unroute('**/src/CodeEditor.tsx*')
  await page.reload()
  await expect(editor(page)).toBeVisible()
  await expect(page.locator('.view-lines')).toContainText('Continued in the fallback editor')
})

test('frontend preview states, keyboard modal exit, and frame checks use authored code', async ({ page }) => {
  const { richSolutions } = await import('../fixtures/rich-solutions.mjs')
  await page.goto('/#/practice/frontend-directory')
  await replaceCode(page, richSolutions['frontend-directory'], 'frontend-directory')
  const preview = page.getByRole('region', { name: 'Interactive preview', exact: true })
  await preview.getByRole('button', { name: 'Update preview', exact: true }).click()
  const frame = page.frameLocator('iframe[title="Your directory implementation"]')
  await expect(frame.getByLabel('Search people')).toBeVisible()
  await frame.getByLabel('Search people').fill('nobody matches')
  await expect(frame.getByText('No people found.', { exact: true })).toBeVisible()
  await chooseOption(preview.getByRole('combobox', { name: 'Request state', exact: true }), 'loading')
  await expect(frame.getByText('Loading…', { exact: true })).toBeVisible()
  await chooseOption(preview.getByRole('combobox', { name: 'Request state', exact: true }), 'error')
  await frame.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(frame.getByText('Retry requested 1 time.', { exact: true })).toBeVisible()
  await chooseOption(preview.getByRole('combobox', { name: 'Request state', exact: true }), 'empty')
  await expect(frame.getByText('No people found.', { exact: true })).toBeVisible()
  await chooseOption(preview.getByRole('combobox', { name: 'Request state', exact: true }), 'ready')
  await chooseOption(preview.getByRole('combobox', { name: 'Viewport', exact: true }), '375')
  await expect(page.locator('iframe[title="Your directory implementation"]')).toHaveCSS('width', '375px')
  await preview.getByRole('button', { name: 'Expand preview', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Expanded preview' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Close Esc', exact: true }).focus()
  await page.keyboard.press('Escape')
  await expect(preview.getByRole('button', { name: 'Expand preview', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await expect(page.locator('iframe[title="Frontend interaction checks"]')).toHaveCount(0)
  await replaceCode(page, richSolutions['frontend-directory'] + '\n// A new draft', 'frontend-directory')
  await expect(preview.getByText('Your code changed. Update the preview to see this version.')).toBeVisible()
  await preview.getByRole('button', { name: 'Close preview', exact: true }).click()
  await expect(page.locator('iframe[title="Your directory implementation"]')).toHaveCount(0)
})

test('an endless loop in frontend checks is stopped and the page stays responsive with the draft kept', async ({ page }) => {
  const { domSolutions } = await import('../fixtures/dom-solutions.mjs')
  const looping = `${domSolutions['dom-tabs']}\nwhile (true) {}`
  await page.goto('/#/practice/dom-tabs')
  await replaceCode(page, looping, 'dom-tabs')
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expect(page.getByText(/A loop ran for more than 2 seconds and was stopped/).first()).toBeVisible({ timeout: 8000 })
  // The page still answers: the step rail responds and the draft is unchanged.
  await page.getByRole('navigation', { name: 'Practice steps' }).getByRole('button', { name: 'Plan', exact: true }).click()
  await expect(page.getByLabel('Your plan', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('.view-lines')).toContainText('while (true)')
})

test('DOM accessibility rep previews its authored props and passes frame checks', async ({ page }) => {
  const { domSolutions } = await import('../fixtures/dom-solutions.mjs')
  await page.goto('/#/practice/dom-tabs')
  await replaceCode(page, domSolutions['dom-tabs'], 'dom-tabs')
  const preview = page.getByRole('region', { name: 'Interactive preview', exact: true })
  await expect(preview.getByRole('combobox', { name: 'Request state', exact: true })).toHaveCount(0)
  await preview.getByRole('button', { name: 'Update preview', exact: true }).click()
  const frame = page.frameLocator('iframe[title="Your tabs implementation"]')
  await frame.getByRole('tab', { name: 'Profile' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(frame.getByRole('tab', { name: 'Security' })).toBeFocused()
  await expect(frame.getByRole('tab', { name: 'Security', selected: true })).toBeVisible()
  await expect(frame.getByText('Change your password.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
})

for (const id of ['dom-accessible-form', 'dom-disclosure', 'dom-tabs', 'dom-live-search', 'dom-accordion']) {
  test(`${id} reference solution passes every check in real Chromium`, async ({ page }) => {
    const { domSolutions } = await import('../fixtures/dom-solutions.mjs')
    await page.goto(`/#/practice/${id}`)
    await replaceCode(page, domSolutions[id], id)
    await page.getByRole('button', { name: 'Run checks', exact: true }).click()
    await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
    // Focus checks move focus into the offscreen frame; it must come back to the page afterwards.
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('IFRAME')
  })
}

test('two tabs on one profile each keep the completion they record', async ({ context }) => {
  // Each tab loads the empty history first, then completes the same rep: neither save may drop the other's record.
  const tabs = [await context.newPage(), await context.newPage()]
  for (const page of tabs) {
    await page.goto(route)
    await expect(editor(page)).toBeVisible()
  }
  for (const page of tabs) {
    await page.bringToFront()
    await page.getByRole('button', { name: 'Plan', exact: true }).click()
    await page.getByLabel('Your plan', { exact: true }).fill('Count occurrences and choose the smaller number when counts tie.')
    await replaceCode(page, solution)
    await page
      .locator('.workspace-toolbar')
      .getByRole('button', { name: /Run checks/ })
      .click()
    await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
    await page.getByRole('button', { name: 'Explain', exact: true }).click()
    await page
      .getByLabel('Your explanation', { exact: true })
      .fill('I count each value, compare counts, and use the smaller value to break ties. Empty input returns null.')
    await page.getByRole('button', { name: 'Finish', exact: true }).click()
    await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
    await expect(page.getByText('Your attempt is saved in the Journal.', { exact: true })).toBeVisible()
  }
  const history = await tabs[0].evaluate(() =>
    JSON.parse(
      Object.entries(localStorage)
        .find(([key]) => key.endsWith(':history:v1'))
        ?.at(1) ?? '[]',
    ),
  )
  expect(history).toHaveLength(2)
})
