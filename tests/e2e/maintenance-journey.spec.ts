import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { editor, expectChecksFinished } from './helpers'
import { maintenanceSolutions } from '../fixtures/maintenance-journey-solutions.mjs'
import { decodeFiles } from '../../src/project-files'

const id = 'fix-quote-bug'
const files = decodeFiles(maintenanceSolutions[id])!.files

/** Paste into the file that is currently open, through Monaco's own paste handler. */
async function pasteIntoOpenFile(page: Page, text: string) {
  await editor(page).focus()
  await expect(editor(page)).toBeFocused()
  await editor(page).press('ControlOrMeta+A')
  await editor(page).evaluate((element, value) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData('text/plain', value)
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }))
  }, text)
}

test('regression case and fix step: starter fails, then guard and fix pass in the worker', async ({ page }) => {
  await page.goto(`/#/practice/${id}`)
  const tabs = page.getByRole('group', { name: 'Project files' })
  for (const name of ['rates.ts', 'quote.ts', 'original.ts', 'guard.ts']) await expect(tabs.getByRole('button', { name })).toBeVisible()
  await expect(tabs.getByRole('button', { name: 'main.ts · entry' })).toBeVisible()

  // The starter has no regression case and the reported bug, so the guard checks fail.
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText(/^\d+ of 11 checks passed$/))
  await expect(page.getByText('All checks passed', { exact: true })).toHaveCount(0)

  // Write the regression case, then fix the line that causes the report.
  await tabs.getByRole('button', { name: 'guard.ts' }).click()
  await expect(tabs.getByRole('button', { name: 'guard.ts' })).toHaveAttribute('aria-pressed', 'true')
  await pasteIntoOpenFile(page, files['guard.ts'])
  await tabs.getByRole('button', { name: 'quote.ts' }).click()
  await expect(tabs.getByRole('button', { name: 'quote.ts' })).toHaveAttribute('aria-pressed', 'true')
  await pasteIntoOpenFile(page, files['quote.ts'])
  await expect(page.getByText(/^\d+ of 11 checks passed$/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
})
