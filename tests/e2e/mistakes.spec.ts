import { expect, test } from '@playwright/test'
import { chooseSegment, expectChecksFinished, replaceCode, route, solution } from './helpers'

async function prepareReview(page: import('@playwright/test').Page) {
  await page.goto(route)
  await page.getByRole('button', { name: 'Plan', exact: true }).first().click()
  await page.getByLabel('Your plan', { exact: true }).fill('Count each value, then keep the most frequent one with the smallest tie-break.')
  await page.getByRole('button', { name: 'Solve', exact: true }).first().click()
  await replaceCode(page, solution)
  await page.locator('.workspace-toolbar').getByRole('button', { name: /Run checks/ }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).first().click()
  await page.getByLabel('Your explanation', { exact: true }).fill('I counted each number in a map and kept the smallest on ties.')
  await page.getByRole('button', { name: 'Review', exact: true }).first().click()
}

test('an empty Mistakes page explains itself and states the self-reported caveat', async ({ page }) => {
  await page.goto('/#/mistakes')
  await expect(page.getByRole('heading', { level: 1, name: 'Mistakes' })).toBeVisible()
  await expect(page.getByText('No mistakes tagged yet')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Progress pages' }).getByRole('button', { name: 'Journal' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('group', { name: 'Journal' }).getByRole('button', { name: 'Mistakes' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByText('What this shows').click()
  await expect(page.getByText(/self-reported and optional/)).toBeVisible()
})

test('tagging is optional, keyboard operable, and appears on Mistakes at a narrow width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepareReview(page)
  await chooseSegment(page, 'What was hardest?', 'Nothing in particular')
  const group = page.getByRole('group', { name: 'Mistakes you made' })
  const tag = group.getByRole('button', { name: 'Off-by-one', exact: true })
  await tag.focus()
  await page.keyboard.press('Space')
  await expect(tag).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Space')
  await expect(tag).toHaveAttribute('aria-pressed', 'false')
  await page.keyboard.press('Space')
  await group.getByRole('button', { name: 'Missed the empty case', exact: true }).click()
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await expect(page.getByText('Your attempt is saved in the Journal.', { exact: true })).toBeVisible()
  await expect(tag).toBeDisabled()

  await expect.poll(() => page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.includes('history')).map(([, value]) => JSON.parse(value)[0]?.mistakes))).toContainEqual(['off-by-one', 'missed-empty-case'])

  await page.goto('/#/mistakes')
  await expect(page.getByRole('heading', { level: 1, name: 'Mistakes' })).toBeVisible()
  await expect(page.getByText('Off-by-one', { exact: true })).toBeVisible()
  await expect(page.getByText('Missed the empty case', { exact: true })).toBeVisible()
  await page.getByText('Off-by-one', { exact: true }).click()
  await expect(page.getByText('New recently').first()).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
  await page.getByRole('button', { name: /Most Frequent Number/i }).first().click()
  await expect(page).toHaveURL(/#\/practice\/most-frequent-number/)
})

test('finishing without any tag still works', async ({ page }) => {
  await prepareReview(page)
  await chooseSegment(page, 'What was hardest?', 'Nothing in particular')
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await expect(page.getByText('Your attempt is saved in the Journal.', { exact: true })).toBeVisible()
  await page.goto('/#/mistakes')
  await expect(page.getByText('No mistakes tagged yet')).toBeVisible()
})
