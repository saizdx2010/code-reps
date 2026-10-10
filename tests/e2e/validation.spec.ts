import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { expectChecksFinished, chooseOption, chooseSegment, editor, replaceCode } from './helpers'
import { validationSolutions } from '../fixtures/validation-solutions.mjs'

async function finish(page: Page, id: string, code: string) {
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Restate the accepted values, name boundary cases, and preserve the input.')
  await replaceCode(page, code, id)
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByLabel('Your explanation', { exact: true }).fill('I traced the boundary and conflicting invalid cases. I return a new object and keep the documented error order.')
  await page.getByRole('button', { name: 'Review', exact: true }).click()
  await chooseSegment(page, 'What was hardest?', 'Nothing in particular')
  // Confidence is optional: completing without it must work.
  await expect(page.getByText('Still needed', { exact: false })).toHaveCount(0)
  await page.getByRole('button', { name: 'Complete rep', exact: false }).click()
  await expect(page.getByText('Attempt recorded in History.', { exact: true })).toBeVisible()
  await expect(page.locator('.workspace-save-status')).toHaveText('Saved in browser')
}

test('validation journey requires a fresh delayed recall and remains discoverable', async ({ page }) => {
  const start = Date.parse('2026-10-02T12:00:00Z')
  await page.clock.setFixedTime(start)
  await page.goto('/#/practice/backend-validate-user')
  const guided = `function validateUser(input: unknown) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null
    const row = input as Record<string, unknown>
    if (typeof row.name !== 'string' || !row.name.trim() || typeof row.age !== 'number' || !Number.isInteger(row.age) || row.age < 0 || row.age > 120) return null
    return {name: row.name.trim(), age: row.age}
  }`
  await finish(page, 'backend-validate-user', guided)
  await page.goto('/#/progress')
  const journey = page.locator('.progress-journey').filter({ has: page.getByRole('heading', { name: 'Validate data at a boundary', exact: true }) })
  await journey.locator('summary').click()
  await expect(journey.locator('.journey-markers')).toHaveAttribute('aria-label', 'Practising')
  await expect(journey.locator('.journey-markers [data-complete=true]')).toHaveCount(1)
  await journey.getByRole('button', { name: 'Try rep', exact: false }).click()
  await expect(page).toHaveURL(/validate-stock-adjustment$/)
  await finish(page, 'validate-stock-adjustment', validationSolutions['validate-stock-adjustment'])
  await page.goto('/#/practice/parse-delivery-window')
  // An early successful solve is usable practice, but must not establish retention.
  await finish(page, 'parse-delivery-window', validationSolutions['parse-delivery-window'])
  await page.goto('/#/progress')
  await expect(journey.locator('.journey-markers')).toHaveAttribute('aria-label', 'Independent')
  await expect(journey.locator('.journey-markers [data-complete=true]')).toHaveCount(2)
  await journey.locator('summary').click()
  await expect(journey.getByRole('button', { name: 'Available later', exact: true })).toBeDisabled()
  await page.clock.setFixedTime(start + 3 * 86_400_000)
  await page.reload()
  await journey.locator('summary').click()
  await journey.getByRole('button', { name: 'Try recall', exact: false }).click()
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await expect(page.getByLabel('Your plan', { exact: true })).toHaveValue('')
  await expect(editor(page)).toBeVisible()
  await expect(page.locator('.view-lines')).toContainText('Implement the written contract')
  await finish(page, 'parse-delivery-window', validationSolutions['parse-delivery-window'])
  await page.goto('/#/progress')
  await expect(journey.locator('.journey-markers')).toHaveAttribute('aria-label', 'Retained')
  await expect(journey.locator('.journey-markers [data-complete=true]')).toHaveCount(3)
  await page.goto('/#/practice')
  await page.getByLabel('Find a rep', { exact: true }).fill('batch before importing')
  await page.getByRole('button', { name: /Validate a batch before importing/ }).click()
  await expect(page).toHaveURL(/validate-import-batch$/)
  await finish(page, 'validate-import-batch', validationSolutions['validate-import-batch'])
})

test('validation prompts and catalogue remain usable at 320 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/practice/parse-delivery-window')
  await expect(page.getByRole('heading', { name: 'Validate a delivery window', exact: true })).toBeVisible()
  expect(await page.locator('.practice-steps').evaluate(nav => Array.from(nav.querySelectorAll('button')).every(button => {
    const label = button.querySelector('span')!.getBoundingClientRect()
    const bounds = button.getBoundingClientRect()
    return label.left >= bounds.left && label.right <= bounds.right
  }))).toBe(true)
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await expect(page.locator('#plan-section')).toBeFocused()
  await page.getByLabel('Your plan', { exact: true }).fill('Small-screen plan with precedence cases.')
  await page.getByRole('button', { name: 'Solve', exact: true }).click()
  await replaceCode(page, validationSolutions['parse-delivery-window'], 'parse-delivery-window')
  await page.keyboard.press('Tab')
  await expect(editor(page)).not.toBeFocused()
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.reload()
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await expect(page.getByLabel('Your plan', { exact: true })).toHaveValue('Small-screen plan with precedence cases.')
  await page.goto('/#/practice')
  await page.locator('.catalog-filters > summary').click()
  await chooseOption(page.getByLabel('Format', { exact: true }), 'backend')
  await page.getByLabel('Find a rep', { exact: true }).fill('stock adjustment')
  await expect(page.getByRole('button', { name: /Validate a stock adjustment/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
