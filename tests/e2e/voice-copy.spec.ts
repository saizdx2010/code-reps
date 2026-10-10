import { test, expect } from '@playwright/test'
import { chooseOption } from './helpers'

test('fresh Trail avoids a duplicate practice list and Progress explains its zeros', async ({ page }) => {
  await page.goto('/#/home')
  await expect(page.locator('#continue-heading')).toBeVisible()
  await expect(page.getByText("Choose today's practice", { exact: true })).toHaveCount(0)
  await page.goto('/#/progress')
  await expect(page.getByText('Finish a rep to record a practice day.', { exact: true })).toBeVisible()
  await expect(page.getByText('Solve a related rep without hints after guided practice.', { exact: true })).toBeVisible()
  await expect(page.getByText('Solve a fresh recall rep without hints after a break.', { exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('main')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('brief and lessons style identifiers and use one evidence note', async ({ page }) => {
  await page.goto('/#/practice/dom-accessible-form')
  const brief = page.locator('#brief-section')
  await expect(brief.locator('code').filter({ hasText: 'form.noValidate' })).toBeVisible()
  const note = brief.locator('details').filter({ has: page.locator('summary', { hasText: 'How this is checked' }) })
  await expect(note).toHaveCount(1)
  await note.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(note).toHaveAttribute('open', '')
  await expect(note).toContainText('You review your plan and explanation yourself')
  await page.goto('/#/knowledge')
  await expect(page.locator('#lesson-read code').filter({ hasText: /^string$/ })).toBeVisible()
  await expect(page.locator('#lesson-read')).toContainText('The types string, number, and boolean')
})

test('Library topic filtering includes related reps from old overlapping categories', async ({ page }) => {
  await page.goto('/#/practice')
  await expect(page.getByLabel('Topic', { exact: true })).toBeVisible()
  await chooseOption(page.getByLabel('Topic', { exact: true }), 'Arrays')
  await expect(page.getByRole('button', { name: /Total available prices/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Find the first long word/ })).toBeVisible()
  await expect(page.getByText('Algorithm / TypeScript', { exact: true })).toHaveCount(0)
  await chooseOption(page.getByLabel('Topic', { exact: true }), 'Maps and sets')
  await expect(page.getByRole('button', { name: /Find a duplicate/ })).toBeVisible()
})

test('Trail shows one compact secondary list when a saved draft offers another choice', async ({ page }) => {
  await page.goto('/#/paths')
  await page.locator('.starting-point-settings > summary').click()
  await page.getByRole('button', { name: /Returning to coding/ }).click()
  await page.goto('/#/practice/declare-variables')
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Keep the greeting and update the name.')
  await page.goto('/#/home')
  await expect(page.getByText("Choose today's practice", { exact: true })).toHaveCount(0)
  const waiting = page.locator('.list-group').filter({ hasText: 'Also waiting' })
  expect(await waiting.locator('.list-row').count()).toBeLessThanOrEqual(2)
})

test('task limits remain visible outside the assessment disclosure', async ({ page }) => {
  await page.goto('/#/practice/sum-positive-numbers')
  await expect(page.locator('#brief-section .task-note')).toBeVisible()
  await expect(page.locator('#brief-section .task-note')).toContainText('Numbers may be decimals as well as whole numbers.')
  await expect(page.locator('#brief-section .task-note')).toContainText('Return 0 for an empty array')
  await expect(page.locator('#brief-section summary').filter({ hasText: 'How this is checked' })).toHaveCount(1)
})
