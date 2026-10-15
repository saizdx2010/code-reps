import { expect, test } from '@playwright/test'
import { expectChecksFinished, replaceCode } from './helpers'
import { dsaSolutions } from '../fixtures/dsa-solutions.mjs'

const cases = [
  ['next-warmer-day', 9, '[3,2,1,0]'],
  ['top-k-frequent-tags', 9, '["api","web"]'],
  ['course-order', 8, '[0,1,2,3]'],
  ['longest-shared-sequence', 6, '1'],
] as const

for (const [id, steps, result] of cases) {
  test(`advanced pattern worker checks and narrow keyboard review: ${id}`, async ({ page }) => {
    await page.goto(`/#/practice/${id}`)
    await page.getByRole('button', { name: 'Explain', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Step trace' })).toHaveCount(0)
    await replaceCode(page, dsaSolutions[id], id)
    await page.getByRole('button', { name: 'Run checks', exact: true }).click()
    await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
    await page.getByRole('button', { name: 'Explain', exact: true }).click()
    await page.getByText('Compare with a model answer', { exact: true }).click()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 320, height: 844 })
    const viewer = page.getByRole('region', { name: 'Step trace' })
    await viewer.focus()
    await viewer.press('ArrowRight')
    await expect(viewer.locator('.trace-note')).toContainText(`Step 2 of ${steps}`)
    await viewer.getByRole('button', { name: `Go to step ${steps}`, exact: true }).click()
    await expect(viewer.locator('.trace-vars')).toContainText(result)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
