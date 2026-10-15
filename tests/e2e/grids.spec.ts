import { expect, test } from '@playwright/test'
import { expectChecksFinished, replaceCode } from './helpers'
import { dsaSolutions } from '../fixtures/dsa-solutions.mjs'

for (const id of ['grid-open-neighbours', 'grid-count-rooms', 'grid-fewest-steps']) {
  test(`grid rep runs in the worker and review remains usable: ${id}`, async ({ page }) => {
    await page.goto(`/#/practice/${id}`)
    await page.getByRole('button', { name: 'Explain', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Step trace' })).toHaveCount(0)
    await replaceCode(page, dsaSolutions[id], id)
    await page.getByRole('button', { name: 'Run checks', exact: true }).click()
    await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
    await page.getByRole('button', { name: 'Explain', exact: true }).click()
    await page.getByText('Compare with a model answer', { exact: true }).click()
    if (id === 'grid-count-rooms') return
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 320, height: 844 })
    const viewer = page.getByRole('region', { name: 'Step trace' })
    await viewer.focus()
    await expect(viewer.locator('.trace-cell')).toHaveCount(id === 'grid-open-neighbours' ? 9 : 6)
    await viewer.press('ArrowRight')
    await expect(viewer.locator('.trace-note')).toContainText('Step 2 of 6')
    await viewer.getByRole('button', { name: 'Go to step 6', exact: true }).click()
    await expect(viewer.locator('.trace-vars')).toContainText(id === 'grid-open-neighbours' ? '[[0,2],[0,0]]' : '4')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
