import { test, expect } from '@playwright/test'
import { expectNoStackedDividers } from './helpers'

test('fresh Trail avoids a duplicate practice list and Progress explains its zeros', async ({ page }) => {
  await page.goto('/#/home')
  await expect(page.locator('#continue-heading')).toBeVisible()
  await expect(page.getByText("Choose today's practice", { exact: true })).toHaveCount(0)
  await page.goto('/#/progress')
  // Before a first rep, one welcome note replaces the zero counts, the empty ladder, and the empty badge shelf.
  await expect(page.getByText('Your skills show up here after your first rep.', { exact: true })).toBeVisible()
  await expect(page.locator('.skill-ladder')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Badges earned' })).toHaveCount(0)
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
  const topic = (name: string) =>
    page.locator('.catalog-rail-list button', { has: page.locator('strong', { hasText: new RegExp(`^${name}$`) }) })
  await topic('Arrays').click()
  await expect(page.getByRole('button', { name: /Total available prices/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Find the first long word/ })).toBeVisible()
  await expect(page.getByText('Algorithm / TypeScript', { exact: true })).toHaveCount(0)
  await topic('Maps and sets').click()
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
  const brief = page.locator('#brief-section .brief-structure')
  await expect(brief).toContainText('Numbers may be decimals as well as whole numbers.')
  await expect(brief).toContainText('Return 0 for an empty array')
  // The note's task sentence stays beside the example; only its checking sentence moves into the disclosure.
  await expect(page.locator('#brief-section .task-note')).toHaveText('In the example, 3 and 5 are added; -2 and 0 add nothing.')
  await expect(page.locator('#brief-section summary').filter({ hasText: 'How this is checked' })).toHaveCount(1)
})

test('main pages never stack two dividers with nothing between them', async ({ page }) => {
  await page.goto('/#/paths')
  await page.locator('.starting-point-settings > summary').click()
  await page.getByRole('button', { name: /Returning to coding/ }).click()
  await page.goto('/#/practice/declare-variables')
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Keep the greeting and update the name.')
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 900 })
    for (const hash of ['#/home', '#/paths', '#/practice', '#/progress', '#/learn']) {
      await page.goto(`/${hash}`)
      await expect(page.locator('h1')).toBeVisible()
      if (hash === '#/home') await expect(page.locator('.list-group').filter({ hasText: 'Also waiting' })).toBeVisible()
      await expectNoStackedDividers(page, `${hash} at ${width}px`)
    }
  }
})
