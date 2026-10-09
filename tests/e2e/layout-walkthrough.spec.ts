import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { CHECK_RUN_COMPLETION_TIMEOUT, editor, replaceCode, route, saved, solution } from './helpers'

type Layout = { name: string; viewport: { width: number; height: number }; scale?: number }

const layouts: Layout[] = [
  { name: 'desktop 1280x800', viewport: { width: 1280, height: 800 } },
  { name: 'narrow 390x844', viewport: { width: 390, height: 844 } },
  { name: 'short 1280x560', viewport: { width: 1280, height: 560 } },
  // A 640x400 viewport at deviceScaleFactor 2 approximates a 200% browser zoom on a 1280x800 window.
  { name: 'zoomed 640x400 @2x', viewport: { width: 640, height: 400 }, scale: 2 },
]

const planDraft = 'Count occurrences per number and return the smallest of the most frequent.'

for (const layout of layouts) {
  test.describe(`layout walkthrough at ${layout.name}`, () => {
    test.use({ viewport: layout.viewport, deviceScaleFactor: layout.scale ?? 1 })

    test('keyboard navigation, editor exit, checks, and persisted drafts', async ({ page }) => {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1, name: 'Find the most frequent number' })).toBeVisible()

      // Tab through the desk; every stop must land on a visible element.
      for (let stop = 0; stop < 8; stop++) {
        await page.keyboard.press('Tab')
        await expect(page.locator(':focus')).toBeVisible()
      }

      // Select the Solve step (needed on narrow/zoomed pane layouts) and type in the real Monaco editor.
      await page.getByRole('navigation', { name: 'Practice steps' }).getByRole('button', { name: 'Solve', exact: true }).click()
      await replaceCode(page, solution)
      await editorFocus(page)
      await page.keyboard.press('ControlOrMeta+ArrowDown')
      await page.keyboard.insertText('// typed during the layout walkthrough')
      await expect(page.locator('.view-lines')).toContainText('typed during the layout walkthrough')

      // Exit the editor with the keyboard and run checks without the mouse.
      await page.keyboard.press('Tab')
      await expect(editor(page)).not.toBeFocused()
      await runChecks(page)
      await expect(page.locator(':focus')).toBeVisible()

      // Write a plan, wait for the save, then reload and confirm both drafts survived.
      await page.getByRole('button', { name: 'Plan', exact: true }).click()
      const plan = page.getByLabel('Your plan', { exact: true })
      await plan.fill(planDraft)
      await saved(page)
      await expect(page.locator(':focus')).toBeVisible()

      await page.reload()
      await page.getByRole('navigation', { name: 'Practice steps' }).getByRole('button', { name: 'Solve', exact: true }).click()
      await expect(editor(page)).toBeVisible()
      await expect(page.locator('.view-lines')).toContainText('typed during the layout walkthrough')
      await page.getByRole('button', { name: 'Plan', exact: true }).click()
      await expect(page.getByLabel('Your plan', { exact: true })).toHaveValue(planDraft)
      await expect(page.locator(':focus')).toBeVisible()
    })
  })
}
async function editorFocus(page: import('@playwright/test').Page) {
  await editor(page).focus()
  await expect(editor(page)).toBeFocused()
}

// The runner stops checks after five wall-clock seconds, which a correct solution can exceed on a
// heavily loaded machine. Retry once when the runner reports a stall instead of failing the layout walk.
async function runChecks(page: Page) {
  const run = page.locator('.workspace-toolbar').getByRole('button', { name: /Run checks/ })
  const passed = page.getByText('All checks passed', { exact: true })
  const stalled = page.getByText('The checks took too long and were stopped. Check for an endless loop, then run again.')
  for (let attempt = 0; attempt < 2; attempt++) {
    await run.focus()
    await run.press('Enter')
    await expect(passed.or(stalled)).toBeVisible({ timeout: CHECK_RUN_COMPLETION_TIMEOUT })
    if (await passed.isVisible()) return
  }
  await expect(passed).toBeVisible({ timeout: CHECK_RUN_COMPLETION_TIMEOUT })
}
